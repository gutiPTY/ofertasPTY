import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { CrearReporteInputSchema } from "@ofertaspty/shared-types";
import { prisma } from "@ofertaspty/database";
import { REPORTES_PARA_REVISION } from "../lib/constants";

const paramsSchema = z.object({ ofertaId: z.string().uuid() });

export default async function reportesRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/ofertas/:ofertaId/reportar",
    {
      preHandler: fastify.authenticate,
      config: { rateLimit: { max: 20, timeWindow: "10 minutes" } },
    },
    async (request, reply) => {
      const { ofertaId } = paramsSchema.parse(request.params);
      const body = CrearReporteInputSchema.parse(request.body);

      const usuario = await prisma.usuario.findUnique({
        where: { supabaseAuthId: request.user!.id },
      });
      if (!usuario) {
        return reply.code(404).send({ error: "usuario_no_sincronizado" });
      }

      // Solo se reportan ofertas ya visibles en el feed público; esto también
      // evita reportar una oferta ya EXPIRADA/RECHAZADA/EN_REVISION.
      const oferta = await prisma.oferta.findFirst({
        where: { id: ofertaId, estado: "PUBLICADA" },
      });
      if (!oferta) {
        return reply.code(404).send({ error: "oferta_no_encontrada" });
      }

      if (oferta.creadoPorId === usuario.id) {
        return reply.code(400).send({ error: "no_puedes_reportar_tu_propia_oferta" });
      }

      const existente = await prisma.reporte.findUnique({
        where: { ofertaId_usuarioId: { ofertaId, usuarioId: usuario.id } },
      });
      if (existente) {
        return reply.code(409).send({ error: "ya_reportaste_esta_oferta" });
      }

      const totalReportes = await prisma.$transaction(async (tx) => {
        await tx.reporte.create({
          data: { ofertaId, usuarioId: usuario.id, motivo: body.motivo },
        });
        const total = await tx.reporte.count({ where: { ofertaId } });
        if (total >= REPORTES_PARA_REVISION) {
          await tx.oferta.update({ where: { id: ofertaId }, data: { estado: "EN_REVISION" } });
        }
        return total;
      });

      return reply.code(201).send({ reportes: totalReportes });
    },
  );
}
