import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@ofertaspty/database";
import { Rol } from "@ofertaspty/shared-types";
import { buildApp } from "../src/app";
import { createTestUser } from "./helpers/test-user";

describe("feed público", () => {
  let admin: Awaited<ReturnType<typeof createTestUser>>;
  let autor: Awaited<ReturnType<typeof createTestUser>>;
  let ofertaPublicadaId: string;
  let ofertaPublicadaSlug: string;
  let ofertaPendienteSlug: string;

  beforeAll(async () => {
    admin = await createTestUser({ role: Rol.ADMIN });
    autor = await createTestUser();
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

    const payload = (titulo: string) => ({
      titulo,
      descripcion: "Descripción de prueba con más de diez caracteres",
      imagenUrl: "https://example.com/a.jpg",
      provincia: "Panamá",
      fechaInicio: new Date().toISOString(),
      fechaVencimiento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      categoriaId: categoria.id,
    });

    const publicadaRes = await app.inject({
      method: "POST",
      url: "/ofertas",
      headers: { authorization: `Bearer ${autor.accessToken}` },
      payload: payload("OfertaFeedVisibleXYZ"),
    });
    ofertaPublicadaId = publicadaRes.json().oferta.id;
    ofertaPublicadaSlug = publicadaRes.json().oferta.slug;

    await app.inject({
      method: "POST",
      url: `/admin/ofertas/${ofertaPublicadaId}/aprobar`,
      headers: { authorization: `Bearer ${admin.accessToken}` },
    });

    const pendienteRes = await app.inject({
      method: "POST",
      url: "/ofertas",
      headers: { authorization: `Bearer ${autor.accessToken}` },
      payload: payload("Oferta pendiente no visible"),
    });
    ofertaPendienteSlug = pendienteRes.json().oferta.slug;
  }, 15000);

  afterAll(async () => {
    await admin.cleanup();
    await autor.cleanup();
  });

  it("GET /ofertas solo devuelve PUBLICADA", async () => {
    const app = buildApp();
    const res = await app.inject({ method: "GET", url: "/ofertas?q=OfertaFeedVisibleXYZ" });
    expect(res.statusCode).toBe(200);
    const { ofertas } = res.json();
    expect(ofertas.some((o: { id: string }) => o.id === ofertaPublicadaId)).toBe(true);
    expect(ofertas.every((o: { estado: string }) => o.estado === "PUBLICADA")).toBe(true);
  });

  it("GET /ofertas/:slug devuelve la oferta publicada", async () => {
    const app = buildApp();
    const res = await app.inject({ method: "GET", url: `/ofertas/${ofertaPublicadaSlug}` });
    expect(res.statusCode).toBe(200);
    expect(res.json().oferta.slug).toBe(ofertaPublicadaSlug);
  });

  it("GET /ofertas/:slug devuelve 404 para una oferta pendiente", async () => {
    const app = buildApp();
    const res = await app.inject({ method: "GET", url: `/ofertas/${ofertaPendienteSlug}` });
    expect(res.statusCode).toBe(404);
  });
});
