import type { FastifyInstance } from "fastify";
import { prisma } from "@ofertaspty/database";
import { GuardarPreferenciasInputSchema } from "@ofertaspty/shared-types";

export default async function preferenciasRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/preferencias/mine",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const usuario = await prisma.usuario.findUnique({
        where: { supabaseAuthId: request.user!.id },
      });
      if (!usuario) {
        return reply.code(404).send({ error: "usuario_no_sincronizado" });
      }

      const preferencias = await prisma.preferenciaUsuario.findMany({
        where: { usuarioId: usuario.id },
      });

      return reply.send({
        categoriaIds: preferencias.filter((p) => p.categoriaId).map((p) => p.categoriaId as string),
        provincias: preferencias.filter((p) => p.provincia).map((p) => p.provincia as string),
      });
    },
  );

  // Reemplaza de una vez todas las preferencias del usuario (no hay edición
  // incremental) — cada categoría/provincia favorita queda como una fila
  // independiente (categoriaId o provincia, nunca ambos a la vez), ver
  // 05-ROADMAP.md Fase 8: coincide una oferta nueva si matchea cualquiera
  // de las dos listas (OR), no ambas a la vez.
  fastify.put(
    "/preferencias/mine",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const body = GuardarPreferenciasInputSchema.parse(request.body);
      const usuario = await prisma.usuario.findUnique({
        where: { supabaseAuthId: request.user!.id },
      });
      if (!usuario) {
        return reply.code(404).send({ error: "usuario_no_sincronizado" });
      }

      await prisma.$transaction(async (tx) => {
        await tx.preferenciaUsuario.deleteMany({ where: { usuarioId: usuario.id } });
        await tx.preferenciaUsuario.createMany({
          data: [
            ...body.categoriaIds.map((categoriaId) => ({ usuarioId: usuario.id, categoriaId })),
            ...body.provincias.map((provincia) => ({ usuarioId: usuario.id, provincia })),
          ],
        });
      });

      return reply.send({ categoriaIds: body.categoriaIds, provincias: body.provincias });
    },
  );
}
