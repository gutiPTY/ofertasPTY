import type { FastifyInstance } from "fastify";
import { prisma } from "@ofertaspty/database";

const NOTIFICACIONES_LIMITE = 20;

export default async function notificacionesRoutes(fastify: FastifyInstance) {
  // Épica 9 — centro de notificaciones interno (campana en el header). Solo
  // trae las últimas N; no hay paginación todavía (alcance acordado con el
  // usuario: ícono + dropdown, sin página dedicada).
  fastify.get(
    "/notificaciones/mine",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const usuario = await prisma.usuario.findUnique({
        where: { supabaseAuthId: request.user!.id },
      });
      if (!usuario) {
        return reply.code(404).send({ error: "usuario_no_sincronizado" });
      }

      const [notificaciones, noLeidas] = await Promise.all([
        prisma.notificacion.findMany({
          where: { usuarioId: usuario.id },
          orderBy: { creadoEn: "desc" },
          take: NOTIFICACIONES_LIMITE,
        }),
        prisma.notificacion.count({ where: { usuarioId: usuario.id, leida: false } }),
      ]);

      return reply.send({ notificaciones, noLeidas });
    },
  );

  // Marca TODAS las notificaciones del usuario como leídas — se llama al
  // abrir el dropdown de la campana (ver AskUserQuestion: "marcar como
  // leída al abrir"), no hay marcado individual.
  fastify.post(
    "/notificaciones/marcar-leidas",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const usuario = await prisma.usuario.findUnique({
        where: { supabaseAuthId: request.user!.id },
      });
      if (!usuario) {
        return reply.code(404).send({ error: "usuario_no_sincronizado" });
      }

      await prisma.notificacion.updateMany({
        where: { usuarioId: usuario.id, leida: false },
        data: { leida: true },
      });

      return reply.send({ ok: true });
    },
  );
}
