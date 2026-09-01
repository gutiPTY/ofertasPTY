import type { FastifyInstance } from "fastify";
import {
  ActualizarLogoComercioInputSchema,
  ContactarAdminInputSchema,
  CrearSolicitudComercioInputSchema,
} from "@ofertaspty/shared-types";
import { prisma } from "@ofertaspty/database";
import { sendEmail } from "../lib/email.js";
import { emailComercioContactoAdmin } from "../lib/email-templates.js";

const comercioSelect = {
  id: true,
  nombre: true,
  categoriaId: true,
  usuarioId: true,
  direccion: true,
  ruc: true,
  direccionFiscal: true,
  representanteLegal: true,
  logoUrl: true,
  estado: true,
  motivoRechazo: true,
  planPago: true,
  terminosAceptadosEn: true,
  creadoEn: true,
  actualizadoEn: true,
} as const;

export default async function comerciosRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/comercios/solicitud",
    {
      preHandler: fastify.authenticate,
      config: { rateLimit: { max: 5, timeWindow: "10 minutes" } },
    },
    async (request, reply) => {
      const usuario = await prisma.usuario.findUnique({
        where: { supabaseAuthId: request.user!.id },
      });
      if (!usuario) {
        return reply.code(404).send({ error: "usuario_no_sincronizado" });
      }

      const body = CrearSolicitudComercioInputSchema.parse(request.body);

      const existente = await prisma.comercio.findUnique({ where: { usuarioId: usuario.id } });
      if (existente && existente.estado !== "RECHAZADO") {
        return reply.code(409).send({ error: "solicitud_ya_existente", estado: existente.estado });
      }

      const data = {
        nombre: body.nombre,
        categoriaId: body.categoriaId,
        direccion: body.direccion,
        ruc: body.ruc,
        direccionFiscal: body.direccionFiscal,
        representanteLegal: body.representanteLegal,
        avisoOperacionesPath: body.avisoOperacionesPath,
        terminosAceptadosEn: new Date(),
        estado: "PENDIENTE" as const,
        motivoRechazo: null,
      };

      const comercio = existente
        ? await prisma.comercio.update({
            where: { id: existente.id },
            data,
            select: comercioSelect,
          })
        : await prisma.comercio.create({
            data: { ...data, usuarioId: usuario.id },
            select: comercioSelect,
          });

      return reply.code(existente ? 200 : 201).send({ comercio });
    },
  );

  fastify.get("/comercios/mine", { preHandler: fastify.authenticate }, async (request, reply) => {
    const usuario = await prisma.usuario.findUnique({
      where: { supabaseAuthId: request.user!.id },
    });
    if (!usuario) {
      return reply.code(404).send({ error: "usuario_no_sincronizado" });
    }

    const comercio = await prisma.comercio.findUnique({
      where: { usuarioId: usuario.id },
      select: { ...comercioSelect, categoria: true },
    });
    if (!comercio) {
      return reply.code(404).send({ error: "sin_comercio" });
    }

    const ofertas = await prisma.oferta.findMany({
      where: { comercioId: comercio.id },
      orderBy: { creadoEn: "desc" },
      include: { categoria: true, moderaciones: { orderBy: { fecha: "desc" }, take: 1 } },
    });

    return reply.send({ comercio, ofertas });
  });

  // El comercio le escribe al admin (ej. para arrancar la afiliación de
  // plan pago, que hoy se gestiona fuera de la plataforma — ver
  // Comercio.planPago en el schema). Va a todos los usuarios con rol
  // ADMIN, con replyTo al email del comercio para que el admin conteste
  // directo desde su bandeja.
  fastify.post(
    "/comercios/contactar-admin",
    {
      preHandler: fastify.authenticate,
      config: { rateLimit: { max: 5, timeWindow: "10 minutes" } },
    },
    async (request, reply) => {
      const usuario = await prisma.usuario.findUnique({
        where: { supabaseAuthId: request.user!.id },
      });
      if (!usuario) {
        return reply.code(404).send({ error: "usuario_no_sincronizado" });
      }

      const comercio = await prisma.comercio.findUnique({ where: { usuarioId: usuario.id } });
      if (!comercio) {
        return reply.code(404).send({ error: "sin_comercio" });
      }

      const body = ContactarAdminInputSchema.parse(request.body);

      const admins = await prisma.usuario.findMany({
        where: { rol: "ADMIN" },
        select: { email: true },
      });
      if (admins.length > 0) {
        const { subject, html } = emailComercioContactoAdmin(
          comercio,
          usuario,
          body.asunto,
          body.mensaje,
        );
        await sendEmail({
          to: admins.map((a) => a.email),
          subject,
          html,
          replyTo: usuario.email,
        });
      }

      return reply.send({ ok: true });
    },
  );

  // Logo del comercio — se puede subir/cambiar en cualquier momento
  // (a diferencia de /comercios/solicitud, que solo acepta reenvíos
  // mientras el comercio esté RECHAZADO). La imagen ya se subió al bucket
  // público "ofertas" del lado del cliente; acá solo se guarda la URL.
  fastify.patch(
    "/comercios/mi-logo",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const usuario = await prisma.usuario.findUnique({
        where: { supabaseAuthId: request.user!.id },
      });
      if (!usuario) {
        return reply.code(404).send({ error: "usuario_no_sincronizado" });
      }

      const existente = await prisma.comercio.findUnique({ where: { usuarioId: usuario.id } });
      if (!existente) {
        return reply.code(404).send({ error: "sin_comercio" });
      }

      const body = ActualizarLogoComercioInputSchema.parse(request.body);

      const comercio = await prisma.comercio.update({
        where: { id: existente.id },
        data: { logoUrl: body.logoUrl },
        select: comercioSelect,
      });

      return reply.send({ comercio });
    },
  );
}
