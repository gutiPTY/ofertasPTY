import type { FastifyInstance } from "fastify";
import { prisma } from "@ofertaspty/database";

export default async function categoriasRoutes(fastify: FastifyInstance) {
  fastify.get("/categorias", async (_request, reply) => {
    const categorias = await prisma.categoria.findMany({ orderBy: { nombre: "asc" } });
    return reply.send({ categorias });
  });
}
