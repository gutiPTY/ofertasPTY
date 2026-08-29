import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@ofertaspty/database";
import { buildApp } from "../src/app";
import { MAX_OFERTAS_PENDIENTES_POR_USUARIO } from "../src/lib/constants";
import { createTestUser } from "./helpers/test-user";

function ofertaPayload(categoriaId: string, overrides: Record<string, unknown> = {}) {
  return {
    titulo: "Oferta de prueba",
    descripcion: "Descripción de prueba con más de diez caracteres",
    imagenUrl: "https://example.com/imagen.jpg",
    provincia: "Panamá",
    fechaInicio: new Date().toISOString(),
    fechaVencimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    categoriaId,
    ...overrides,
  };
}

describe("/ofertas", () => {
  let user: Awaited<ReturnType<typeof createTestUser>>;
  let categoriaId: string;

  beforeAll(async () => {
    user = await createTestUser();
    const categoria = await prisma.categoria.findFirstOrThrow();
    categoriaId = categoria.id;

    const app = buildApp();
    await app.inject({
      method: "POST",
      url: "/auth/sync",
      headers: { authorization: `Bearer ${user.accessToken}` },
      payload: { email: user.email, nombre: "Test User" },
    });
  }, 40000);

  afterAll(async () => {
    await user.cleanup();
  }, 30000);

  it("POST /ofertas rechaza sin token", async () => {
    const app = buildApp();
    const res = await app.inject({ method: "POST", url: "/ofertas", payload: {} });
    expect(res.statusCode).toBe(401);
  });

  it("POST /ofertas crea una oferta en estado PENDIENTE", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/ofertas",
      headers: { authorization: `Bearer ${user.accessToken}` },
      payload: ofertaPayload(categoriaId),
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().oferta.estado).toBe("PENDIENTE");
  }, 15000);

  it("GET /ofertas/mine devuelve las ofertas del usuario autenticado", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/ofertas/mine",
      headers: { authorization: `Bearer ${user.accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().ofertas.length).toBeGreaterThan(0);
  }, 15000);

  it("POST /ofertas respeta el límite de pendientes simultáneas", async () => {
    // Timeout alto: hace varias llamadas reales a Supabase en serie.
    const app = buildApp();
    const usuario = await prisma.usuario.findUniqueOrThrow({
      where: { supabaseAuthId: user.supabaseAuthId },
    });
    // Ya hay al menos 1 pendiente del test anterior; completamos hasta el límite.
    const pendientesActuales = await prisma.oferta.count({
      where: { estado: "PENDIENTE", creadoPorId: usuario.id },
    });
    const faltan = MAX_OFERTAS_PENDIENTES_POR_USUARIO - pendientesActuales;
    for (let i = 0; i < Math.max(faltan, 0); i++) {
      await app.inject({
        method: "POST",
        url: "/ofertas",
        headers: { authorization: `Bearer ${user.accessToken}` },
        payload: ofertaPayload(categoriaId),
      });
    }

    const res = await app.inject({
      method: "POST",
      url: "/ofertas",
      headers: { authorization: `Bearer ${user.accessToken}` },
      payload: ofertaPayload(categoriaId),
    });
    expect(res.statusCode).toBe(429);
  }, 60000);
});
