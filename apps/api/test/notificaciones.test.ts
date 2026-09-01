import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@ofertaspty/database";
import { buildApp } from "../src/app";
import { createTestUser } from "./helpers/test-user";

describe("/notificaciones", () => {
  let usuario: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    usuario = await createTestUser();

    const app = buildApp();
    await app.inject({
      method: "POST",
      url: "/auth/sync",
      headers: { authorization: `Bearer ${usuario.accessToken}` },
      payload: { email: usuario.email, nombre: "Usuario Notificaciones" },
    });

    const registrado = await prisma.usuario.findUniqueOrThrow({
      where: { supabaseAuthId: usuario.supabaseAuthId },
    });
    await prisma.notificacion.createMany({
      data: [
        { usuarioId: registrado.id, mensaje: "Primera notificación de prueba" },
        { usuarioId: registrado.id, mensaje: "Segunda notificación de prueba" },
      ],
    });
  }, 40000);

  afterAll(async () => {
    await usuario.cleanup();
  }, 30000);

  it("GET /notificaciones/mine rechaza sin token", async () => {
    const app = buildApp();
    const res = await app.inject({ method: "GET", url: "/notificaciones/mine" });
    expect(res.statusCode).toBe(401);
  });

  it("GET /notificaciones/mine devuelve la lista y el conteo de no leídas", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/notificaciones/mine",
      headers: { authorization: `Bearer ${usuario.accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.notificaciones).toHaveLength(2);
    expect(body.noLeidas).toBe(2);
  }, 15000);

  it("POST /notificaciones/marcar-leidas marca todas como leídas", async () => {
    const app = buildApp();
    const marcar = await app.inject({
      method: "POST",
      url: "/notificaciones/marcar-leidas",
      headers: { authorization: `Bearer ${usuario.accessToken}` },
    });
    expect(marcar.statusCode).toBe(200);

    const res = await app.inject({
      method: "GET",
      url: "/notificaciones/mine",
      headers: { authorization: `Bearer ${usuario.accessToken}` },
    });
    const body = res.json();
    expect(body.noLeidas).toBe(0);
    expect(body.notificaciones.every((n: { leida: boolean }) => n.leida)).toBe(true);
  }, 15000);
});
