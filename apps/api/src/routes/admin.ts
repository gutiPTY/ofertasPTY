import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  EditarOfertaInputSchema,
  EnviarPromocionComerciosInputSchema,
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
import {
  emailOfertaAprobada,
  emailOfertaEditada,
  emailOfertaRechazada,
  emailPromocionComercio,
} from "../lib/email-templates.js";

const OFERTA_ESTADOS_EDITABLES = new Set(["PENDIENTE", "EN_REVISION"]);
const HISTORIAL_ESTADOS = ["PUBLICADA", "RECHAZADA", "EXPIRADA"] as const;
const HISTORIAL_PAGE_SIZE = 15;
const TODAS_PAGE_SIZE = 20;
const TODOS_ESTADOS = ["PENDIENTE", "EN_REVISION", "PUBLICADA", "RECHAZADA", "EXPIRADA"] as const;

const historialQuerySchema = z.object({
  estado: z.enum(HISTORIAL_ESTADOS).default("PUBLICADA"),
  page: z.coerce.number().int().positive().default(1),
});

const todasOfertasQuerySchema = z.object({
  estado: z.enum(TODOS_ESTADOS).optional(),
  page: z.coerce.number().int().positive().default(1),
});

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
        where: { estado: "PENDIENTE", oculta: false },
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
        where: { estado: "EN_REVISION", oculta: false },
        orderBy: { actualizadoEn: "asc" },
        include: { categoria: true, creadoPor: true, reportes: true },
      });
      return reply.send({ ofertas });
    },
  );

  // Dashboard — conteo de ofertas por estado + de usuarios por cuántas
  // ofertas PUBLICADA tienen. El agregado de usuarios es un solo query SQL
  // (GROUP BY + FILTER), barato aunque crezca la base; el frontend lo
  // renderiza en su propio Suspense boundary para no bloquear las colas de
  // moderación si algún día se vuelve más pesado.
  fastify.get(
    "/admin/dashboard/stats",
    { preHandler: requireAdmin },
    async (_request, reply) => {
      const [porEstado, usuarioStats] = await Promise.all([
        prisma.oferta.groupBy({ by: ["estado"], _count: { _all: true } }),
        prisma.$queryRaw<
          { total: bigint; sinOfertas: bigint; conUna: bigint; conCincoOMas: bigint }[]
        >`
          SELECT
            COUNT(*)::bigint AS total,
            COUNT(*) FILTER (WHERE cnt = 0)::bigint AS "sinOfertas",
            COUNT(*) FILTER (WHERE cnt = 1)::bigint AS "conUna",
            COUNT(*) FILTER (WHERE cnt >= 5)::bigint AS "conCincoOMas"
          FROM (
            SELECT u.id, COUNT(o.id) FILTER (WHERE o.estado = 'PUBLICADA') AS cnt
            FROM "Usuario" u
            LEFT JOIN "Oferta" o ON o."creadoPorId" = u.id
            GROUP BY u.id
          ) sub;
        `,
      ]);

      const ofertasPorEstado: Record<string, number> = {
        PENDIENTE: 0,
        EN_REVISION: 0,
        PUBLICADA: 0,
        RECHAZADA: 0,
        EXPIRADA: 0,
      };
      for (const fila of porEstado) ofertasPorEstado[fila.estado] = fila._count._all;

      const fila = usuarioStats[0]!;
      return reply.send({
        ofertasPorEstado,
        usuarios: {
          total: Number(fila.total),
          sinOfertas: Number(fila.sinOfertas),
          conUna: Number(fila.conUna),
          conCincoOMas: Number(fila.conCincoOMas),
        },
      });
    },
  );

  // Historial de moderación — a diferencia de /pendientes y /en-revision
  // (colas accionables), esto es de solo lectura: para cada oferta ya
  // decidida muestra quién la aprobó/rechazó/editó (Moderacion/OfertaEdicion
  // ya guardaban el admin responsable, pero no se exponía en la UI).
  fastify.get(
    "/admin/ofertas/historial",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { estado, page } = historialQuerySchema.parse(request.query);
      const where = { estado, oculta: false };

      const [ofertas, total] = await Promise.all([
        prisma.oferta.findMany({
          where,
          orderBy: { actualizadoEn: "desc" },
          skip: (page - 1) * HISTORIAL_PAGE_SIZE,
          take: HISTORIAL_PAGE_SIZE,
          include: {
            categoria: true,
            creadoPor: true,
            moderaciones: { orderBy: { fecha: "desc" }, take: 1, include: { moderador: true } },
            ediciones: { orderBy: { fecha: "desc" }, take: 1, include: { admin: true } },
          },
        }),
        prisma.oferta.count({ where }),
      ]);

      return reply.send({ ofertas, total, page, pageSize: HISTORIAL_PAGE_SIZE });
    },
  );

  // "Todas las ofertas" — a diferencia de /pendientes, /en-revision y
  // /historial (colas separadas por estado), esta lista TODO sin filtrar
  // por defecto, incluidas las ocultas (con su badge), para que el admin
  // pueda encontrar y gestionar cualquier oferta desde un solo lugar.
  fastify.get(
    "/admin/ofertas",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { estado, page } = todasOfertasQuerySchema.parse(request.query);
      const where = estado ? { estado } : {};

      const [ofertas, total] = await Promise.all([
        prisma.oferta.findMany({
          where,
          orderBy: { creadoEn: "desc" },
          skip: (page - 1) * TODAS_PAGE_SIZE,
          take: TODAS_PAGE_SIZE,
          include: { categoria: true, creadoPor: true },
        }),
        prisma.oferta.count({ where }),
      ]);

      return reply.send({ ofertas, total, page, pageSize: TODAS_PAGE_SIZE });
    },
  );

  // Remoción admin: nunca borra la fila (preserva Moderacion/Reporte/
  // OfertaEdicion para auditoría, ver CLAUDE.md) — solo la oculta de toda
  // vista pública y de las colas normales del admin. Se puede deshacer con
  // /mostrar. Sin restricción de estado: un admin puede ocultar cualquier
  // oferta desde "Todas las ofertas", sea cual sea su estado actual.
  fastify.post(
    "/admin/ofertas/:id/ocultar",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { id } = idParamsSchema.parse(request.params);
      const admin = await currentAdmin(request.user!.id);

      const oferta = await prisma.oferta.update({
        where: { id },
        data: { oculta: true, ocultaEn: new Date(), ocultaPorId: admin.id },
      });

      return reply.send({ oferta });
    },
  );

  fastify.post(
    "/admin/ofertas/:id/mostrar",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { id } = idParamsSchema.parse(request.params);

      const oferta = await prisma.oferta.update({
        where: { id },
        data: { oculta: false, ocultaEn: null, ocultaPorId: null },
      });

      return reply.send({ oferta });
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

  // El admin manda una promo a uno o varios comercios verificados (ej.
  // avisar de una campaña, invitar a activar el plan pago). Un email
  // individual por comercio (no un solo "to" con todos juntos) para que
  // ningún destinatario vea la lista de los demás.
  fastify.post(
    "/admin/comercios/enviar-promocion",
    {
      preHandler: requireAdmin,
      config: { rateLimit: { max: 10, timeWindow: "10 minutes" } },
    },
    async (request, reply) => {
      const body = EnviarPromocionComerciosInputSchema.parse(request.body);

      const comercios = await prisma.comercio.findMany({
        where: { id: { in: body.comercioIds } },
        include: { usuario: true },
      });
      if (comercios.length === 0) {
        return reply.code(404).send({ error: "comercios_no_encontrados" });
      }

      const { subject, html } = emailPromocionComercio(body.asunto, body.mensaje);
      await Promise.all(
        comercios.map((comercio) => sendEmail({ to: comercio.usuario.email, subject, html })),
      );

      return reply.send({ ok: true, enviados: comercios.length });
    },
  );
}
