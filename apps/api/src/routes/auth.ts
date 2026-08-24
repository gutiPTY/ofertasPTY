import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@ofertaspty/database";
import { Rol } from "@ofertaspty/shared-types";

const syncBodySchema = z.object({
  email: z.string().email(),
  nombre: z.string().min(1),
});

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/auth/me",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const usuario = await prisma.usuario.findUnique({
        where: { supabaseAuthId: request.user!.id },
      });

      if (!usuario) {
        return reply.code(404).send({ error: "usuario_no_sincronizado" });
      }

      return reply.send({ usuario, role: request.user!.role });
    },
  );

  fastify.post(
    "/auth/sync",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const body = syncBodySchema.parse(request.body);

      const usuario = await prisma.usuario.upsert({
        where: { supabaseAuthId: request.user!.id },
        update: { email: body.email, nombre: body.nombre },
        create: {
          supabaseAuthId: request.user!.id,
          email: body.email,
          nombre: body.nombre,
          rol: Rol.USUARIO,
        },
      });

      return reply.send({ usuario });
    },
  );
}
