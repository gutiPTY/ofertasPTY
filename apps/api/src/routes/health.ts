import type { FastifyInstance } from "fastify";
import { prisma } from "@ofertaspty/database";

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return reply.send({ status: "ok" });
    } catch (error) {
      fastify.log.error(error, "health check failed");
      return reply.code(503).send({ status: "error" });
    }
  });
}
