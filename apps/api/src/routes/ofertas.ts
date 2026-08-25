import type { FastifyInstance } from "fastify";
import { CrearOfertaInputSchema } from "@ofertaspty/shared-types";
import { prisma } from "@ofertaspty/database";
import { MAX_OFERTAS_PENDIENTES_POR_USUARIO } from "../lib/constants";

export default async function ofertasRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/ofertas",
    {
      preHandler: fastify.authenticate,
      config: { rateLimit: { max: 10, timeWindow: "10 minutes" } },
    },
    async (request, reply) => {
      const usuario = await prisma.usuario.findUnique({
        where: { supabaseAuthId: request.user!.id },
      });
      if (!usuario) {
        return reply.code(404).send({ error: "usuario_no_sincronizado" });
      }

      const body = CrearOfertaInputSchema.parse(request.body);

      const pendientes = await prisma.oferta.count({
        where: { creadoPorId: usuario.id, estado: "PENDIENTE" },
      });
      if (pendientes >= MAX_OFERTAS_PENDIENTES_POR_USUARIO) {
        return reply.code(429).send({ error: "limite_ofertas_pendientes" });
      }

      const oferta = await prisma.oferta.create({
        data: {
          titulo: body.titulo,
          descripcion: body.descripcion,
          imagenUrl: body.imagenUrl,
          precioOriginal: body.precioOriginal,
          precioOferta: body.precioOferta,
          provincia: body.provincia,
          distrito: body.distrito,
          direccion: body.direccion,
          linkExterno: body.linkExterno,
          fechaInicio: body.fechaInicio,
          fechaVencimiento: body.fechaVencimiento,
          categoriaId: body.categoriaId,
          creadoPorId: usuario.id,
        },
      });

      return reply.code(201).send({ oferta });
    },
  );

  fastify.get(
    "/ofertas/mine",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const usuario = await prisma.usuario.findUnique({
        where: { supabaseAuthId: request.user!.id },
      });
      if (!usuario) {
        return reply.code(404).send({ error: "usuario_no_sincronizado" });
      }

      const ofertas = await prisma.oferta.findMany({
        where: { creadoPorId: usuario.id },
        orderBy: { creadoEn: "desc" },
        include: {
          categoria: true,
          moderaciones: { orderBy: { fecha: "desc" }, take: 1 },
        },
      });

      return reply.send({ ofertas });
    },
  );
}
