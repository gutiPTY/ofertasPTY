import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ModerarOfertaInputSchema, Rol } from "@ofertaspty/shared-types";
import { prisma } from "@ofertaspty/database";

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
        include: { categoria: true, creadoPor: true },
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
        const oferta = await tx.oferta.update({
          where: { id },
          data: { estado: "PUBLICADA" },
        });
        await tx.moderacion.create({
          data: { ofertaId: id, moderadorId: admin.id, decision: "PUBLICADA" },
        });
        return oferta;
      });

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
        });
        await tx.moderacion.create({
          data: {
            ofertaId: id,
            moderadorId: admin.id,
            decision: "RECHAZADA",
            motivo: body.motivo,
          },
        });
        return oferta;
      });

      return reply.send({ oferta });
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
}
