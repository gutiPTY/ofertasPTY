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

  it("DELETE /notificaciones/:id rechaza sin token", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "DELETE",
      url: "/notificaciones/00000000-0000-0000-0000-000000000000",
    });
    expect(res.statusCode).toBe(401);
  });

  it("DELETE /notificaciones/:id de otro usuario devuelve 404", async () => {
    const otro = await createTestUser();
    const app = buildApp();
    await app.inject({
      method: "POST",
      url: "/auth/sync",
      headers: { authorization: `Bearer ${otro.accessToken}` },
      payload: { email: otro.email, nombre: "Otro Usuario" },
    });

    const propias = await app.inject({
      method: "GET",
      url: "/notificaciones/mine",
      headers: { authorization: `Bearer ${usuario.accessToken}` },
    });
    const [notificacionAjena] = propias.json().notificaciones;

    const res = await app.inject({
      method: "DELETE",
      url: `/notificaciones/${notificacionAjena.id}`,
      headers: { authorization: `Bearer ${otro.accessToken}` },
    });
    expect(res.statusCode).toBe(404);

    await otro.cleanup();
  }, 20000);

  it("DELETE /notificaciones/:id borra una notificación puntual", async () => {
    const app = buildApp();
    const antes = await app.inject({
      method: "GET",
      url: "/notificaciones/mine",
      headers: { authorization: `Bearer ${usuario.accessToken}` },
    });
    const [primera] = antes.json().notificaciones;

    const eliminar = await app.inject({
      method: "DELETE",
      url: `/notificaciones/${primera.id}`,
      headers: { authorization: `Bearer ${usuario.accessToken}` },
    });
    expect(eliminar.statusCode).toBe(200);

    const despues = await app.inject({
      method: "GET",
      url: "/notificaciones/mine",
      headers: { authorization: `Bearer ${usuario.accessToken}` },
    });
    expect(
      despues.json().notificaciones.some((n: { id: string }) => n.id === primera.id),
    ).toBe(false);
  }, 15000);

  it("DELETE /notificaciones/mine borra todas las notificaciones del usuario", async () => {
    const app = buildApp();
    const eliminar = await app.inject({
      method: "DELETE",
      url: "/notificaciones/mine",
      headers: { authorization: `Bearer ${usuario.accessToken}` },
    });
    expect(eliminar.statusCode).toBe(200);

    const res = await app.inject({
      method: "GET",
      url: "/notificaciones/mine",
      headers: { authorization: `Bearer ${usuario.accessToken}` },
    });
    const body = res.json();
    expect(body.notificaciones).toHaveLength(0);
    expect(body.noLeidas).toBe(0);
  }, 15000);
});
