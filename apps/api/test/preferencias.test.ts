import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@ofertaspty/database";
import { buildApp } from "../src/app";
import { createTestUser } from "./helpers/test-user";

describe("/preferencias", () => {
  let usuario: Awaited<ReturnType<typeof createTestUser>>;
  let categoriaId: string;

  beforeAll(async () => {
    usuario = await createTestUser();
    const categoria = await prisma.categoria.findFirstOrThrow();
    categoriaId = categoria.id;

    const app = buildApp();
    await app.inject({
      method: "POST",
      url: "/auth/sync",
      headers: { authorization: `Bearer ${usuario.accessToken}` },
      payload: { email: usuario.email, nombre: "Usuario Preferencias" },
    });
  }, 40000);

  afterAll(async () => {
    await usuario.cleanup();
  }, 30000);

  it("GET /preferencias/mine devuelve listas vacías si no configuró nada", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/preferencias/mine",
      headers: { authorization: `Bearer ${usuario.accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ categoriaIds: [], provincias: [] });
  }, 15000);

  it("PUT /preferencias/mine guarda categorías y provincias favoritas", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "PUT",
      url: "/preferencias/mine",
      headers: { authorization: `Bearer ${usuario.accessToken}` },
      payload: { categoriaIds: [categoriaId], provincias: ["Panamá", "Chiriquí"] },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ categoriaIds: [categoriaId], provincias: ["Panamá", "Chiriquí"] });

    const getRes = await app.inject({
      method: "GET",
      url: "/preferencias/mine",
      headers: { authorization: `Bearer ${usuario.accessToken}` },
    });
    expect(getRes.json().provincias.sort()).toEqual(["Chiriquí", "Panamá"]);
  }, 15000);

  it("PUT /preferencias/mine reemplaza (no acumula) las preferencias anteriores", async () => {
    const app = buildApp();
    await app.inject({
      method: "PUT",
      url: "/preferencias/mine",
      headers: { authorization: `Bearer ${usuario.accessToken}` },
      payload: { categoriaIds: [], provincias: ["Colón"] },
    });

    const getRes = await app.inject({
      method: "GET",
      url: "/preferencias/mine",
      headers: { authorization: `Bearer ${usuario.accessToken}` },
    });
    expect(getRes.json()).toEqual({ categoriaIds: [], provincias: ["Colón"] });
  }, 15000);

  it("PUT /preferencias/mine rechaza una provincia inválida", async () => {
    // El resto de la API tampoco traduce ZodError a 400 (no hay
    // setErrorHandler global) — se mantiene la misma convención acá.
    const app = buildApp();
    const res = await app.inject({
      method: "PUT",
      url: "/preferencias/mine",
      headers: { authorization: `Bearer ${usuario.accessToken}` },
      payload: { categoriaIds: [], provincias: ["Provincia Inventada"] },
    });
    expect(res.statusCode).toBe(500);
  }, 15000);

  it("rechaza sin token", async () => {
    const app = buildApp();
    const res = await app.inject({ method: "GET", url: "/preferencias/mine" });
    expect(res.statusCode).toBe(401);
  });
});
