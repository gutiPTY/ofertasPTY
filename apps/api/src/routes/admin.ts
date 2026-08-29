import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  EditarOfertaInputSchema,
  ModerarOfertaInputSchema,
  RechazarComercioInputSchema,
  REPUTACION_PUNTOS_APROBACION,
  REPUTACION_PUNTOS_RECHAZO,
  Rol,
} from "@ofertaspty/shared-types";
import { prisma } from "@ofertaspty/database";
import { supabaseAdmin } from "../lib/supabase-admin.js";
import { COMERCIO_DOCS_BUCKET, COMERCIO_DOC_SIGNED_URL_SECONDS } from "../lib/constants.js";
import { sendEmail } from "../lib/email.js";
import { emailOfertaAprobada, emailOfertaEditada, emailOfertaRechazada } from "../lib/email-templates.js";

const OFERTA_ESTADOS_EDITABLES = new Set(["PENDIENTE", "EN_REVISION"]);

function serializar(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  if (valor instanceof Date) return valor.toISOString();
  return String(valor);
}

const idParamsSchema = z.object({ id: z.string().uuid() });

export default async function adminRoutes(fastify: FastifyInstance) {
  const requireAdmin = [fastify.authenticate, fastify.requireRole([Rol.ADMIN])];

  async function currentAdmin(supabaseAuthId: string) {
    return prisma.usuario.findUniqueOrThrow({ where: { supabaseAuthId } });
  }

  fastify.get(
    "/admin/ofertas/pendientes",
    { preHandler: requireAdmin },
    async (_request, reply) => {
      const ofertas = await prisma.oferta.findMany({
        where: { estado: "PENDIENTE" },
        orderBy: { creadoEn: "asc" },
        include: { categoria: true, creadoPor: true, comercio: true },
      });
      // Ofertas de comercios con plan pago aparecen primero (prioridad),
      // pero siguen requiriendo aprobación manual del admin igual que
      // cualquier otra — nunca se saltan la moderación (ver CLAUDE.md).
      // Se ordena en memoria: Prisma ordena por un campo de una relación
      // opcional con NULLS FIRST en DESC (comportamiento default de
      // Postgres), lo que dejaba las ofertas sin comercio primero.
      // Dentro de cada grupo de plan pago, prioriza revisar primero a los
      // autores de menor reputación (Épica 10: mayor riesgo de contenido
      // falso, ver 05-ROADMAP.md Fase 7).
      ofertas.sort((a, b) => {
        const planPagoDiff =
          Number(b.comercio?.planPago ?? false) - Number(a.comercio?.planPago ?? false);
        if (planPagoDiff !== 0) return planPagoDiff;
        return a.creadoPor.reputacion - b.creadoPor.reputacion;
      });
      return reply.send({ ofertas });
    },
  );

  fastify.get(
    "/admin/ofertas/en-revision",
    { preHandler: requireAdmin },
    async (_request, reply) => {
      const ofertas = await prisma.oferta.findMany({
        where: { estado: "EN_REVISION" },
        orderBy: { actualizadoEn: "asc" },
        include: { categoria: true, creadoPor: true, reportes: true },
      });
      return reply.send({ ofertas });
    },
  );

  fastify.post(
    "/admin/ofertas/:id/aprobar",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { id } = idParamsSchema.parse(request.params);
      const admin = await currentAdmin(request.user!.id);

      const oferta = await prisma.$transaction(async (tx) => {
        const existente = await tx.oferta.findUniqueOrThrow({
          where: { id },
          include: { comercio: true },
        });
        // Se marca destacada automáticamente si viene de un comercio con
        // plan pago (ver Épica 5 / 01-PRD.md punto 6).
        const oferta = await tx.oferta.update({
          where: { id },
          data: {
            estado: "PUBLICADA",
            destacada: existente.comercio?.planPago ?? false,
            publicadaEn: new Date(),
          },
          include: { creadoPor: true },
        });
        await tx.moderacion.create({
          data: { ofertaId: id, moderadorId: admin.id, decision: "PUBLICADA" },
        });
        await tx.usuario.update({
          where: { id: existente.creadoPorId },
          data: { reputacion: { increment: REPUTACION_PUNTOS_APROBACION } },
        });
        return oferta;
      });

      const { subject, html } = emailOfertaAprobada(oferta);
      await sendEmail({ to: oferta.creadoPor.email, subject, html });

      return reply.send({ oferta });
    },
  );

  fastify.post(
    "/admin/ofertas/:id/rechazar",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { id } = idParamsSchema.parse(request.params);
      const body = ModerarOfertaInputSchema.parse(request.body ?? {});
      const admin = await currentAdmin(request.user!.id);

      const oferta = await prisma.$transaction(async (tx) => {
        const oferta = await tx.oferta.update({
          where: { id },
          data: { estado: "RECHAZADA" },
          include: { creadoPor: true },
        });
        await tx.moderacion.create({
          data: {
            ofertaId: id,
            moderadorId: admin.id,
            decision: "RECHAZADA",
            motivo: body.motivo,
          },
        });
        await tx.usuario.update({
          where: { id: oferta.creadoPorId },
          data: { reputacion: { increment: REPUTACION_PUNTOS_RECHAZO } },
        });
        return oferta;
      });

      const { subject, html } = emailOfertaRechazada(oferta, body.motivo);
      await sendEmail({ to: oferta.creadoPor.email, subject, html });

      return reply.send({ oferta });
    },
  );

  // Épica 3 (ampliada Fase 5): el admin corrige datos menores (precio,
  // fecha, etc.) de una oferta que el usuario cargó mal, antes de decidir
  // sobre ella. Solo mientras sigue PENDIENTE o EN_REVISION — no se puede
  // reescribir contenido de una oferta ya publicada/rechazada desde acá.
  fastify.patch(
    "/admin/ofertas/:id",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { id } = idParamsSchema.parse(request.params);
      const body = EditarOfertaInputSchema.parse(request.body);
      const admin = await currentAdmin(request.user!.id);

      const actual = await prisma.oferta.findUniqueOrThrow({
        where: { id },
        include: { creadoPor: true },
      });

      if (!OFERTA_ESTADOS_EDITABLES.has(actual.estado)) {
        return reply.code(409).send({ error: "no_editable_en_este_estado" });
      }

      const cambios: Record<string, { anterior: string | null; nuevo: string | null }> = {};
      for (const [campo, nuevoValor] of Object.entries(body)) {
        const anteriorValor = (actual as unknown as Record<string, unknown>)[campo];
        const anteriorSerializado = serializar(anteriorValor);
        const nuevoSerializado = serializar(nuevoValor);
        if (anteriorSerializado !== nuevoSerializado) {
          cambios[campo] = { anterior: anteriorSerializado, nuevo: nuevoSerializado };
        }
      }

      if (Object.keys(cambios).length === 0) {
        return reply.send({ oferta: actual, cambios: {} });
      }

      const oferta = await prisma.$transaction(async (tx) => {
        const actualizado = await tx.oferta.update({
          where: { id },
          data: body,
          include: { creadoPor: true },
        });
        await tx.ofertaEdicion.create({
          data: { ofertaId: id, adminId: admin.id, cambios },
        });
        return actualizado;
      });

      const { subject, html } = emailOfertaEditada(oferta, cambios);
      await sendEmail({ to: oferta.creadoPor.email, subject, html });

      return reply.send({ oferta, cambios });
    },
  );

  fastify.post(
    "/admin/usuarios/:id/suspender",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { id } = idParamsSchema.parse(request.params);
      const usuario = await prisma.usuario.findUniqueOrThrow({ where: { id } });
      const actualizado = await prisma.usuario.update({
        where: { id },
        data: { suspendido: !usuario.suspendido },
      });
      return reply.send({ usuario: actualizado });
    },
  );

  fastify.get(
    "/admin/comercios/pendientes",
    { preHandler: requireAdmin },
    async (_request, reply) => {
      const comercios = await prisma.comercio.findMany({
        where: { estado: "PENDIENTE" },
        orderBy: { creadoEn: "asc" },
        include: { categoria: true, usuario: true },
      });
      return reply.send({ comercios });
    },
  );

  fastify.get(
    "/admin/comercios/verificados",
    { preHandler: requireAdmin },
    async (_request, reply) => {
      const comercios = await prisma.comercio.findMany({
        where: { estado: "VERIFICADO" },
        orderBy: { nombre: "asc" },
        include: { categoria: true, usuario: true },
      });
      return reply.send({ comercios });
    },
  );

  // URL firmada de corta duración para el documento privado (aviso de
  // operaciones) — nunca se expone la ruta cruda ni se hace público el
  // bucket (contiene RUC y datos fiscales).
  fastify.get(
    "/admin/comercios/:id/documento",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { id } = idParamsSchema.parse(request.params);
      const comercio = await prisma.comercio.findUniqueOrThrow({ where: { id } });

      const { data, error } = await supabaseAdmin.storage
        .from(COMERCIO_DOCS_BUCKET)
        .createSignedUrl(comercio.avisoOperacionesPath, COMERCIO_DOC_SIGNED_URL_SECONDS);

      if (error || !data) {
        return reply.code(502).send({ error: "no_se_pudo_generar_url" });
      }
      return reply.send({ url: data.signedUrl });
    },
  );

  fastify.post(
    "/admin/comercios/:id/verificar",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { id } = idParamsSchema.parse(request.params);
      const comercio = await prisma.comercio.findUniqueOrThrow({
        where: { id },
        include: { usuario: true },
      });

      // Un ADMIN nunca pierde su rol acá, aunque sea dueño del comercio
      // que se está verificando (pasa al probar el flujo con la propia
      // cuenta real de admin — en producción no debería darse, porque el
      // admin no se da de alta como comercio con su cuenta).
      if (comercio.usuario.rol !== Rol.ADMIN) {
        // El rol de negocio viaja en app_metadata del JWT de Supabase, no
        // solo en la columna Usuario.rol (ver plugins/supabase-auth.ts) —
        // hay que actualizar ambos lados.
        const { error } = await supabaseAdmin.auth.admin.updateUserById(
          comercio.usuario.supabaseAuthId,
          { app_metadata: { role: Rol.COMERCIO } },
        );
        if (error) {
          return reply.code(502).send({ error: "no_se_pudo_actualizar_rol" });
        }
        await prisma.usuario.update({ where: { id: comercio.usuarioId }, data: { rol: "COMERCIO" } });
      }

      const actualizado = await prisma.comercio.update({
        where: { id },
        data: { estado: "VERIFICADO", motivoRechazo: null },
      });

      return reply.send({ comercio: actualizado });
    },
  );

  fastify.post(
    "/admin/comercios/:id/rechazar",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { id } = idParamsSchema.parse(request.params);
      const body = RechazarComercioInputSchema.parse(request.body);

      const comercio = await prisma.comercio.update({
        where: { id },
        data: { estado: "RECHAZADO", motivoRechazo: body.motivo },
      });

      return reply.send({ comercio });
    },
  );

  fastify.post(
    "/admin/comercios/:id/plan-pago",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { id } = idParamsSchema.parse(request.params);
      const comercio = await prisma.comercio.findUniqueOrThrow({ where: { id } });

      const actualizado = await prisma.comercio.update({
        where: { id },
        data: { planPago: !comercio.planPago },
      });

      return reply.send({ comercio: actualizado });
    },
  );
}
