import type { FastifyInstance } from "fastify";
import { CrearSolicitudComercioInputSchema } from "@ofertaspty/shared-types";
import { prisma } from "@ofertaspty/database";

const comercioSelect = {
  id: true,
  nombre: true,
  categoriaId: true,
  usuarioId: true,
  direccion: true,
  ruc: true,
  direccionFiscal: true,
  representanteLegal: true,
  estado: true,
  motivoRechazo: true,
  planPago: true,
  terminosAceptadosEn: true,
  creadoEn: true,
  actualizadoEn: true,
} as const;

export default async function comerciosRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/comercios/solicitud",
    {
      preHandler: fastify.authenticate,
      config: { rateLimit: { max: 5, timeWindow: "10 minutes" } },
    },
    async (request, reply) => {
      const usuario = await prisma.usuario.findUnique({
        where: { supabaseAuthId: request.user!.id },
      });
      if (!usuario) {
        return reply.code(404).send({ error: "usuario_no_sincronizado" });
      }

      const body = CrearSolicitudComercioInputSchema.parse(request.body);

      const existente = await prisma.comercio.findUnique({ where: { usuarioId: usuario.id } });
      if (existente && existente.estado !== "RECHAZADO") {
        return reply.code(409).send({ error: "solicitud_ya_existente", estado: existente.estado });
      }

      const data = {
        nombre: body.nombre,
        categoriaId: body.categoriaId,
        direccion: body.direccion,
        ruc: body.ruc,
        direccionFiscal: body.direccionFiscal,
        representanteLegal: body.representanteLegal,
        avisoOperacionesPath: body.avisoOperacionesPath,
        terminosAceptadosEn: new Date(),
        estado: "PENDIENTE" as const,
        motivoRechazo: null,
      };

      const comercio = existente
        ? await prisma.comercio.update({
            where: { id: existente.id },
            data,
            select: comercioSelect,
          })
        : await prisma.comercio.create({
            data: { ...data, usuarioId: usuario.id },
            select: comercioSelect,
          });

      return reply.code(existente ? 200 : 201).send({ comercio });
    },
  );

  fastify.get("/comercios/mine", { preHandler: fastify.authenticate }, async (request, reply) => {
    const usuario = await prisma.usuario.findUnique({
      where: { supabaseAuthId: request.user!.id },
    });
    if (!usuario) {
      return reply.code(404).send({ error: "usuario_no_sincronizado" });
    }

    const comercio = await prisma.comercio.findUnique({
      where: { usuarioId: usuario.id },
      select: { ...comercioSelect, categoria: true },
    });
    if (!comercio) {
      return reply.code(404).send({ error: "sin_comercio" });
    }

    const conteoPorEstado = await prisma.oferta.groupBy({
      by: ["estado"],
      where: { comercioId: comercio.id },
      _count: { _all: true },
    });

    return reply.send({
      comercio,
      ofertasPorEstado: Object.fromEntries(
        conteoPorEstado.map((row) => [row.estado, row._count._all]),
      ),
    });
  });
}
