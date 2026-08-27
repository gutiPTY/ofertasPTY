import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@ofertaspty/database";
import { Rol } from "@ofertaspty/shared-types";
import { buildApp } from "../src/app";
import { createTestUser } from "./helpers/test-user";
import { REPORTES_PARA_REVISION } from "../src/lib/constants";

describe("/ofertas/:ofertaId/reportar", () => {
  let admin: Awaited<ReturnType<typeof createTestUser>>;
  let autor: Awaited<ReturnType<typeof createTestUser>>;
  let reportante: Awaited<ReturnType<typeof createTestUser>>;
  let ofertaId: string;
  const usuariosSinteticosIds: string[] = [];

  beforeAll(async () => {
    admin = await createTestUser({ role: Rol.ADMIN });
    autor = await createTestUser();
    reportante = await createTestUser();
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
      headers: { authorization: `Bearer ${reportante.accessToken}` },
      payload: { email: reportante.email, nombre: "Reportante Test" },
    });

    const crearRes = await app.inject({
      method: "POST",
      url: "/ofertas",
      headers: { authorization: `Bearer ${autor.accessToken}` },
      payload: {
        titulo: "Oferta para reportar",
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
    await prisma.reporte.deleteMany({ where: { ofertaId } });
    if (usuariosSinteticosIds.length > 0) {
      await prisma.usuario.deleteMany({ where: { id: { in: usuariosSinteticosIds } } });
    }
    await admin.cleanup();
    await autor.cleanup();
    await reportante.cleanup();
  }, 30000);

  it("rechaza sin token", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: `/ofertas/${ofertaId}/reportar`,
      payload: { motivo: "Oferta vencida" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("el autor no puede reportar su propia oferta", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: `/ofertas/${ofertaId}/reportar`,
      headers: { authorization: `Bearer ${autor.accessToken}` },
      payload: { motivo: "Oferta vencida" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("no_puedes_reportar_tu_propia_oferta");
  });

  it("crea un reporte y rechaza el duplicado del mismo usuario", async () => {
    const app = buildApp();
    const primero = await app.inject({
      method: "POST",
      url: `/ofertas/${ofertaId}/reportar`,
      headers: { authorization: `Bearer ${reportante.accessToken}` },
      payload: { motivo: "Oferta vencida" },
    });
    expect(primero.statusCode).toBe(201);
    expect(primero.json().reportes).toBe(1);

    const duplicado = await app.inject({
      method: "POST",
      url: `/ofertas/${ofertaId}/reportar`,
      headers: { authorization: `Bearer ${reportante.accessToken}` },
      payload: { motivo: "Otra vez" },
    });
    expect(duplicado.statusCode).toBe(409);
  }, 15000);

  it(`al llegar a ${REPORTES_PARA_REVISION} reportes mueve la oferta a EN_REVISION`, async () => {
    const app = buildApp();

    // "reportante" ya dejó 1 reporte en el test anterior. Se completa el
    // resto con usuarios insertados directo en la base (no hace falta pasar
    // por Supabase Auth solo para sumar al conteo) y el último reporte se
    // manda por el endpoint real para disparar la transición de estado.
    const faltantes = REPORTES_PARA_REVISION - 2;
    for (let i = 0; i < faltantes; i++) {
      const usuario = await prisma.usuario.create({
        data: {
          email: `sintetico-${randomUUID()}@example.com`,
          nombre: `Sintético ${i}`,
          supabaseAuthId: randomUUID(),
        },
      });
      usuariosSinteticosIds.push(usuario.id);
      await prisma.reporte.create({
        data: { ofertaId, usuarioId: usuario.id, motivo: "Relleno de umbral" },
      });
    }

    const reportanteFinal = await createTestUser();
    await app.inject({
      method: "POST",
      url: "/auth/sync",
      headers: { authorization: `Bearer ${reportanteFinal.accessToken}` },
      payload: { email: reportanteFinal.email, nombre: "Reportante Final" },
    });

    const res = await app.inject({
      method: "POST",
      url: `/ofertas/${ofertaId}/reportar`,
      headers: { authorization: `Bearer ${reportanteFinal.accessToken}` },
      payload: { motivo: "Oferta claramente vencida" },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().reportes).toBe(REPORTES_PARA_REVISION);

    const oferta = await prisma.oferta.findUniqueOrThrow({ where: { id: ofertaId } });
    expect(oferta.estado).toBe("EN_REVISION");

    await reportanteFinal.cleanup();
  }, 60000);

  it("GET /admin/ofertas/en-revision lista la oferta reportada", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/admin/ofertas/en-revision",
      headers: { authorization: `Bearer ${admin.accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    const ids = res.json().ofertas.map((o: { id: string }) => o.id);
    expect(ids).toContain(ofertaId);
  });
});
