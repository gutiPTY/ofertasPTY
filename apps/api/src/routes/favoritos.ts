import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@ofertaspty/database";

const paramsSchema = z.object({ ofertaId: z.string().uuid() });

export default async function favoritosRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/favoritos/:ofertaId",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const { ofertaId } = paramsSchema.parse(request.params);

      const usuario = await prisma.usuario.findUnique({
        where: { supabaseAuthId: request.user!.id },
      });
      if (!usuario) {
        return reply.code(404).send({ error: "usuario_no_sincronizado" });
      }

      const oferta = await prisma.oferta.findFirst({
        where: { id: ofertaId, estado: "PUBLICADA" },
      });
      if (!oferta) {
        return reply.code(404).send({ error: "oferta_no_encontrada" });
      }

      const existente = await prisma.favorito.findUnique({
        where: { usuarioId_ofertaId: { usuarioId: usuario.id, ofertaId } },
      });

      if (existente) {
        await prisma.favorito.delete({ where: { id: existente.id } });
        return reply.send({ favorito: false });
      }

      await prisma.favorito.create({ data: { usuarioId: usuario.id, ofertaId } });
      return reply.send({ favorito: true });
    },
  );

  fastify.get(
    "/favoritos/mine",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const usuario = await prisma.usuario.findUnique({
        where: { supabaseAuthId: request.user!.id },
      });
      if (!usuario) {
        return reply.code(404).send({ error: "usuario_no_sincronizado" });
      }

      const favoritos = await prisma.favorito.findMany({
        where: { usuarioId: usuario.id },
        orderBy: { creadoEn: "desc" },
        include: { oferta: { include: { categoria: true } } },
      });

      return reply.send({ favoritos });
    },
  );
}
