import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { CrearValoracionInputSchema } from "@ofertaspty/shared-types";
import { prisma } from "@ofertaspty/database";

const paramsSchema = z.object({ ofertaId: z.string().uuid() });

async function contarValoraciones(ofertaId: string) {
  const [buenas, malas] = await Promise.all([
    prisma.valoracion.count({ where: { ofertaId, esBuena: true } }),
    prisma.valoracion.count({ where: { ofertaId, esBuena: false } }),
  ]);
  return { buenas, malas };
}

export default async function valoracionesRoutes(fastify: FastifyInstance) {
  // Indicador público de calidad (Buena/Mala): un voto por usuario por
  // oferta, se puede cambiar (upsert), sin efecto en reputación ni en el
  // flujo de moderación (eso sigue siendo exclusivo de /reportar).
  fastify.post(
    "/ofertas/:ofertaId/valorar",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const { ofertaId } = paramsSchema.parse(request.params);
      const body = CrearValoracionInputSchema.parse(request.body);

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

      if (oferta.creadoPorId === usuario.id) {
        return reply.code(400).send({ error: "no_puedes_valorar_tu_propia_oferta" });
      }

      await prisma.valoracion.upsert({
        where: { ofertaId_usuarioId: { ofertaId, usuarioId: usuario.id } },
        create: { ofertaId, usuarioId: usuario.id, esBuena: body.esBuena },
        update: { esBuena: body.esBuena },
      });

      const conteos = await contarValoraciones(ofertaId);
      return reply.send({ miValoracion: body.esBuena, ...conteos });
    },
  );
}
