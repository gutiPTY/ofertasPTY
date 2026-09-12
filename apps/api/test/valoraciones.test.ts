import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@ofertaspty/database";
import { Rol } from "@ofertaspty/shared-types";
import { buildApp } from "../src/app";
import { createTestUser } from "./helpers/test-user";

describe("/ofertas/:ofertaId/valorar", () => {
  let admin: Awaited<ReturnType<typeof createTestUser>>;
  let autor: Awaited<ReturnType<typeof createTestUser>>;
  let votante: Awaited<ReturnType<typeof createTestUser>>;
  let ofertaId: string;

  beforeAll(async () => {
    admin = await createTestUser({ role: Rol.ADMIN });
    autor = await createTestUser();
    votante = await createTestUser();
    const categoria = await prisma.categoria.findFirstOrThrow();

    const app = buildApp();
    await app.inject({
      method: "POST",
      url: "/auth/sync",
      headers: { authorization: `Bearer ${admin.accessToken}` },
      payload: { email: admin.email, nombre: "Admin Test" },
    });
    const adminUsuario = await prisma.usuario.findUniqueOrThrow({
      where: { supabaseAuthId: admin.supabaseAuthId },
    });
    await prisma.usuario.update({ where: { id: adminUsuario.id }, data: { rol: Rol.ADMIN } });

    await app.inject({
      method: "POST",
      url: "/auth/sync",
      headers: { authorization: `Bearer ${autor.accessToken}` },
      payload: { email: autor.email, nombre: "Autor Test" },
    });
    await app.inject({
      method: "POST",
      url: "/auth/sync",
      headers: { authorization: `Bearer ${votante.accessToken}` },
      payload: { email: votante.email, nombre: "Votante Test" },
    });

    const crearRes = await app.inject({
      method: "POST",
      url: "/ofertas",
      headers: { authorization: `Bearer ${autor.accessToken}` },
      payload: {
        titulo: "Oferta para valorar",
        descripcion: "Descripción de prueba con más de diez caracteres",
        imagenUrl: "https://example.com/a.jpg",
        provincia: "Panamá",
        fechaInicio: new Date().toISOString(),
        fechaVencimiento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        categoriaId: categoria.id,
      },
    });
    ofertaId = crearRes.json().oferta.id;

    await app.inject({
      method: "POST",
      url: `/admin/ofertas/${ofertaId}/aprobar`,
      headers: { authorization: `Bearer ${admin.accessToken}` },
    });
  }, 40000);

  afterAll(async () => {
    await prisma.valoracion.deleteMany({ where: { ofertaId } });
    await admin.cleanup();
    await autor.cleanup();
    await votante.cleanup();
  }, 30000);

  it("rechaza sin token", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: `/ofertas/${ofertaId}/valorar`,
      payload: { esBuena: true },
    });
    expect(res.statusCode).toBe(401);
  });

  it("el autor no puede valorar su propia oferta", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: `/ofertas/${ofertaId}/valorar`,
      headers: { authorization: `Bearer ${autor.accessToken}` },
      payload: { esBuena: true },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("no_puedes_valorar_tu_propia_oferta");
  });

  it("registra un voto y permite cambiarlo (upsert, no duplica)", async () => {
    const app = buildApp();

    const primero = await app.inject({
      method: "POST",
      url: `/ofertas/${ofertaId}/valorar`,
      headers: { authorization: `Bearer ${votante.accessToken}` },
      payload: { esBuena: true },
    });
    expect(primero.statusCode).toBe(200);
    expect(primero.json()).toEqual({ miValoracion: true, buenas: 1, malas: 0 });

    const cambio = await app.inject({
      method: "POST",
      url: `/ofertas/${ofertaId}/valorar`,
      headers: { authorization: `Bearer ${votante.accessToken}` },
      payload: { esBuena: false },
    });
    expect(cambio.statusCode).toBe(200);
    expect(cambio.json()).toEqual({ miValoracion: false, buenas: 0, malas: 1 });

    const total = await prisma.valoracion.count({ where: { ofertaId } });
    expect(total).toBe(1);
  }, 15000);

  it("GET /ofertas/:slug incluye los conteos de valoraciones", async () => {
    const app = buildApp();
    const oferta = await prisma.oferta.findUniqueOrThrow({ where: { id: ofertaId } });
    const res = await app.inject({ method: "GET", url: `/ofertas/${oferta.slug}` });
    expect(res.statusCode).toBe(200);
    expect(res.json().oferta.valoracionesBuenas).toBe(0);
    expect(res.json().oferta.valoracionesMalas).toBe(1);
  });
});
