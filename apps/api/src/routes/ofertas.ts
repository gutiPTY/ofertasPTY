import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { CrearOfertaInputSchema, FEED_PAGE_SIZE, FiltrosFeedSchema } from "@ofertaspty/shared-types";
import { prisma } from "@ofertaspty/database";
import { MAX_OFERTAS_PENDIENTES_POR_USUARIO } from "../lib/constants.js";
import { slugify } from "../lib/slugify.js";

export default async function ofertasRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/ofertas",
    {
      preHandler: fastify.authenticate,
      config: { rateLimit: { max: 10, timeWindow: "10 minutes" } },
    },
    async (request, reply) => {
      const usuario = await prisma.usuario.findUnique({
        where: { supabaseAuthId: request.user!.id },
      });
      if (!usuario) {
        return reply.code(404).send({ error: "usuario_no_sincronizado" });
      }

      const body = CrearOfertaInputSchema.parse(request.body);

      const pendientes = await prisma.oferta.count({
        where: { creadoPorId: usuario.id, estado: "PENDIENTE" },
      });
      if (pendientes >= MAX_OFERTAS_PENDIENTES_POR_USUARIO) {
        return reply.code(429).send({ error: "limite_ofertas_pendientes" });
      }

      // Épica 5: si quien publica es un comercio verificado, la oferta
      // queda asociada automáticamente (nunca lo decide el cliente, para
      // que nadie pueda atribuirse ofertas de otro comercio). Sigue
      // arrancando en PENDIENTE igual que cualquier oferta.
      const comercio = await prisma.comercio.findUnique({
        where: { usuarioId: usuario.id },
      });
      const comercioId = comercio?.estado === "VERIFICADO" ? comercio.id : undefined;

      const id = randomUUID();
      const slug = `${slugify(body.titulo)}-${id.slice(0, 8)}`;

      const oferta = await prisma.oferta.create({
        data: {
          id,
          slug,
          titulo: body.titulo,
          descripcion: body.descripcion,
          imagenUrl: body.imagenUrl,
          precioOriginal: body.precioOriginal,
          precioOferta: body.precioOferta,
          provincia: body.provincia,
          distrito: body.distrito,
          direccion: body.direccion,
          linkExterno: body.linkExterno,
          fechaInicio: body.fechaInicio,
          fechaVencimiento: body.fechaVencimiento,
          diaSemana: body.diaSemana,
          categoriaId: body.categoriaId,
          creadoPorId: usuario.id,
          comercioId,
        },
      });

      return reply.code(201).send({ oferta });
    },
  );

  fastify.get(
    "/ofertas/mine",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const usuario = await prisma.usuario.findUnique({
        where: { supabaseAuthId: request.user!.id },
      });
      if (!usuario) {
        return reply.code(404).send({ error: "usuario_no_sincronizado" });
      }

      const ofertas = await prisma.oferta.findMany({
        where: { creadoPorId: usuario.id },
        orderBy: { creadoEn: "desc" },
        include: {
          categoria: true,
          moderaciones: { orderBy: { fecha: "desc" }, take: 1 },
        },
      });

      return reply.send({ ofertas });
    },
  );

  // Feed público: solo ofertas PUBLICADA, nunca otro estado (regla de
  // negocio no negociable, ver CLAUDE.md).
  fastify.get("/ofertas", async (request, reply) => {
    const filtros = FiltrosFeedSchema.parse(request.query);

    const where = {
      estado: "PUBLICADA" as const,
      ...(filtros.categoriaId ? { categoriaId: filtros.categoriaId } : {}),
      ...(filtros.provincia ? { provincia: filtros.provincia } : {}),
      ...(filtros.q
        ? {
            OR: [
              { titulo: { contains: filtros.q, mode: "insensitive" as const } },
              { descripcion: { contains: filtros.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(filtros.precioMin !== undefined || filtros.precioMax !== undefined
        ? {
            precioOferta: {
              ...(filtros.precioMin !== undefined ? { gte: filtros.precioMin } : {}),
              ...(filtros.precioMax !== undefined ? { lte: filtros.precioMax } : {}),
            },
          }
        : {}),
    };

    const [ofertas, total] = await Promise.all([
      prisma.oferta.findMany({
        where,
        orderBy: [{ destacada: "desc" }, { creadoEn: "desc" }],
        include: { categoria: true },
        skip: (filtros.page - 1) * FEED_PAGE_SIZE,
        take: FEED_PAGE_SIZE,
      }),
      prisma.oferta.count({ where }),
    ]);

    return reply.send({ ofertas, total, page: filtros.page, pageSize: FEED_PAGE_SIZE });
  });

  // Sección "Ofertas destacadas" del feed público — capada, sin
  // paginación (Épica 5).
  fastify.get("/ofertas/destacadas", async (_request, reply) => {
    const ofertas = await prisma.oferta.findMany({
      where: { estado: "PUBLICADA", destacada: true },
      orderBy: { creadoEn: "desc" },
      take: 6,
      include: { categoria: true },
    });
    return reply.send({ ofertas });
  });

  fastify.get("/ofertas/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const oferta = await prisma.oferta.findFirst({
      where: { slug, estado: "PUBLICADA" },
      include: { categoria: true, comercio: true },
    });

    if (!oferta) {
      return reply.code(404).send({ error: "oferta_no_encontrada" });
    }

    return reply.send({ oferta });
  });
}
