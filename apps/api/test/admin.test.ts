import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@ofertaspty/database";
import { Rol } from "@ofertaspty/shared-types";
import { buildApp } from "../src/app";
import { createTestUser } from "./helpers/test-user";

describe("/admin", () => {
  let admin: Awaited<ReturnType<typeof createTestUser>>;
  let autor: Awaited<ReturnType<typeof createTestUser>>;
  let ofertaId: string;

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
    // /auth/sync siempre crea con rol USUARIO; para las pruebas de admin hay
    // que promoverlo también en la tabla Usuario (no solo en el JWT).
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

    const createRes = await app.inject({
      method: "POST",
      url: "/ofertas",
      headers: { authorization: `Bearer ${autor.accessToken}` },
      payload: {
        titulo: "Oferta para moderar",
        descripcion: "Descripción de prueba con más de diez caracteres",
        imagenUrl: "https://example.com/a.jpg",
        provincia: "Panamá",
        fechaInicio: new Date().toISOString(),
        fechaVencimiento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        categoriaId: categoria.id,
      },
    });
    ofertaId = createRes.json().oferta.id;
  }, 40000);

  afterAll(async () => {
    // Orden importa: borra primero la Moderacion (vía admin.cleanup, que
    // matchea por moderadorId) antes de que autor.cleanup borre la Oferta.
    await admin.cleanup();
    await autor.cleanup();
  }, 30000);

  it("GET /admin/ofertas/pendientes rechaza a un usuario sin rol admin", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/admin/ofertas/pendientes",
      headers: { authorization: `Bearer ${autor.accessToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it("GET /admin/ofertas/pendientes lista la oferta creada", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/admin/ofertas/pendientes",
      headers: { authorization: `Bearer ${admin.accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    const ids = res.json().ofertas.map((o: { id: string }) => o.id);
    expect(ids).toContain(ofertaId);
  });

  it("PATCH /admin/ofertas/:id edita campos y audita el cambio", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "PATCH",
      url: `/admin/ofertas/${ofertaId}`,
      headers: { authorization: `Bearer ${admin.accessToken}` },
      payload: { precioOferta: 42.5, titulo: "Oferta para moderar (corregida)" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().oferta.titulo).toBe("Oferta para moderar (corregida)");
    expect(res.json().cambios.titulo).toBeDefined();
    expect(res.json().cambios.precioOferta).toBeDefined();

    const edicion = await prisma.ofertaEdicion.findFirst({ where: { ofertaId } });
    expect(edicion?.adminId).toBeDefined();
    expect((edicion?.cambios as Record<string, unknown>).titulo).toBeDefined();
  }, 15000);

  it("PATCH /admin/ofertas/:id no cambia nada si los valores enviados son iguales", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "PATCH",
      url: `/admin/ofertas/${ofertaId}`,
      headers: { authorization: `Bearer ${admin.accessToken}` },
      payload: { titulo: "Oferta para moderar (corregida)" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().cambios).toEqual({});
  }, 15000);

  it("POST /admin/ofertas/:id/rechazar cambia el estado y audita la decisión", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: `/admin/ofertas/${ofertaId}/rechazar`,
      headers: { authorization: `Bearer ${admin.accessToken}` },
      payload: { motivo: "Precio no verificable" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().oferta.estado).toBe("RECHAZADA");

    const moderacion = await prisma.moderacion.findFirst({ where: { ofertaId } });
    expect(moderacion?.decision).toBe("RECHAZADA");
    expect(moderacion?.motivo).toBe("Precio no verificable");
  }, 15000);

  it("PATCH /admin/ofertas/:id rechaza editar una oferta ya no editable (RECHAZADA)", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "PATCH",
      url: `/admin/ofertas/${ofertaId}`,
      headers: { authorization: `Bearer ${admin.accessToken}` },
      payload: { titulo: "Intento de edición tardía" },
    });
    expect(res.statusCode).toBe(409);
  }, 15000);
});

describe("/admin — Épica 10 reputación de usuarios", () => {
  let admin: Awaited<ReturnType<typeof createTestUser>>;
  let autorRico: Awaited<ReturnType<typeof createTestUser>>;
  let autorPobre: Awaited<ReturnType<typeof createTestUser>>;
  let ofertaRicoId: string;
  let ofertaPobreId: string;

  async function crearOfertaPendiente(
    autor: Awaited<ReturnType<typeof createTestUser>>,
    categoriaId: string,
  ) {
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/ofertas",
      headers: { authorization: `Bearer ${autor.accessToken}` },
      payload: {
        titulo: "Oferta reputación " + Math.random().toString(36).slice(2),
        descripcion: "Descripción de prueba con más de diez caracteres",
        imagenUrl: "https://example.com/a.jpg",
        provincia: "Panamá",
        fechaInicio: new Date().toISOString(),
        fechaVencimiento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        categoriaId,
      },
    });
    return res.json().oferta.id as string;
  }

  beforeAll(async () => {
    admin = await createTestUser({ role: Rol.ADMIN });
    autorRico = await createTestUser();
    autorPobre = await createTestUser();
    const categoria = await prisma.categoria.findFirstOrThrow();

    const app = buildApp();
    for (const [usuario, nombre] of [
      [admin, "Admin Reputación"],
      [autorRico, "Autor Rico"],
      [autorPobre, "Autor Pobre"],
    ] as const) {
      await app.inject({
        method: "POST",
        url: "/auth/sync",
        headers: { authorization: `Bearer ${usuario.accessToken}` },
        payload: { email: usuario.email, nombre },
      });
    }
    await prisma.usuario.update({
      where: { supabaseAuthId: admin.supabaseAuthId },
      data: { rol: Rol.ADMIN },
    });
    // autorRico arranca con reputación alta simulada; autorPobre se queda
    // en el default (0) para probar la priorización por bajo puntaje.
    await prisma.usuario.update({
      where: { supabaseAuthId: autorRico.supabaseAuthId },
      data: { reputacion: 50 },
    });

    ofertaRicoId = await crearOfertaPendiente(autorRico, categoria.id);
    ofertaPobreId = await crearOfertaPendiente(autorPobre, categoria.id);
  }, 40000);

  afterAll(async () => {
    await admin.cleanup();
    await autorRico.cleanup();
    await autorPobre.cleanup();
  }, 60000);

  it("prioriza en la cola a los autores de menor reputación", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/admin/ofertas/pendientes",
      headers: { authorization: `Bearer ${admin.accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    const ids = res.json().ofertas.map((o: { id: string }) => o.id);
    const idxPobre = ids.indexOf(ofertaPobreId);
    const idxRico = ids.indexOf(ofertaRicoId);
    expect(idxPobre).toBeGreaterThanOrEqual(0);
    expect(idxRico).toBeGreaterThanOrEqual(0);
    expect(idxPobre).toBeLessThan(idxRico);
  }, 15000);

  it("aprobar una oferta suma puntos de reputación al autor", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: `/admin/ofertas/${ofertaPobreId}/aprobar`,
      headers: { authorization: `Bearer ${admin.accessToken}` },
    });
    expect(res.statusCode).toBe(200);

    const usuario = await prisma.usuario.findUniqueOrThrow({
      where: { supabaseAuthId: autorPobre.supabaseAuthId },
    });
    expect(usuario.reputacion).toBe(5);
  }, 15000);

  it("rechazar una oferta resta puntos de reputación al autor", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: `/admin/ofertas/${ofertaRicoId}/rechazar`,
      headers: { authorization: `Bearer ${admin.accessToken}` },
      payload: { motivo: "Prueba de reputación" },
    });
    expect(res.statusCode).toBe(200);

    const usuario = await prisma.usuario.findUniqueOrThrow({
      where: { supabaseAuthId: autorRico.supabaseAuthId },
    });
    expect(usuario.reputacion).toBe(45);
  }, 15000);
});

describe("/admin — dashboard, historial y promociones", () => {
  let admin: Awaited<ReturnType<typeof createTestUser>>;
  let autor: Awaited<ReturnType<typeof createTestUser>>;
  let duenoComercio: Awaited<ReturnType<typeof createTestUser>>;
  let ofertaAprobadaId: string;
  let comercioId: string;

  beforeAll(async () => {
    admin = await createTestUser({ role: Rol.ADMIN });
    autor = await createTestUser();
    duenoComercio = await createTestUser();
    const categoria = await prisma.categoria.findFirstOrThrow();

    const app = buildApp();
    for (const [usuario, nombre] of [
      [admin, "Admin Dashboard"],
      [autor, "Autor Dashboard"],
      [duenoComercio, "Dueño Comercio Dashboard"],
    ] as const) {
      await app.inject({
        method: "POST",
        url: "/auth/sync",
        headers: { authorization: `Bearer ${usuario.accessToken}` },
        payload: { email: usuario.email, nombre },
      });
    }
    await prisma.usuario.update({
      where: { supabaseAuthId: admin.supabaseAuthId },
      data: { rol: Rol.ADMIN },
    });

    const crearRes = await app.inject({
      method: "POST",
      url: "/ofertas",
      headers: { authorization: `Bearer ${autor.accessToken}` },
      payload: {
        titulo: "Oferta para historial",
        descripcion: "Descripción de prueba con más de diez caracteres",
        imagenUrl: "https://example.com/a.jpg",
        provincia: "Panamá",
        fechaInicio: new Date().toISOString(),
        fechaVencimiento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        categoriaId: categoria.id,
      },
    });
    ofertaAprobadaId = crearRes.json().oferta.id;
    await app.inject({
      method: "POST",
      url: `/admin/ofertas/${ofertaAprobadaId}/aprobar`,
      headers: { authorization: `Bearer ${admin.accessToken}` },
    });

    const solicitudRes = await app.inject({
      method: "POST",
      url: "/comercios/solicitud",
      headers: { authorization: `Bearer ${duenoComercio.accessToken}` },
      payload: {
        nombre: "Comercio Dashboard Test",
        categoriaId: categoria.id,
        direccion: "Vía España, Panamá",
        ruc: "1-111-1111",
        direccionFiscal: "Vía España, Panamá",
        representanteLegal: "Juan Pérez",
        avisoOperacionesPath: "fake/aviso-de-prueba.pdf",
        terminosAceptados: true,
      },
    });
    comercioId = solicitudRes.json().comercio.id;
    await app.inject({
      method: "POST",
      url: `/admin/comercios/${comercioId}/verificar`,
      headers: { authorization: `Bearer ${admin.accessToken}` },
    });
  }, 40000);

  afterAll(async () => {
    await admin.cleanup();
    await autor.cleanup();
    await duenoComercio.cleanup();
  }, 60000);

  it("GET /admin/dashboard/stats rechaza a un usuario sin rol admin", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/admin/dashboard/stats",
      headers: { authorization: `Bearer ${autor.accessToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it("GET /admin/dashboard/stats devuelve conteos de ofertas y usuarios", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/admin/dashboard/stats",
      headers: { authorization: `Bearer ${admin.accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ofertasPorEstado.PUBLICADA).toBeGreaterThanOrEqual(1);
    expect(body.usuarios.total).toBeGreaterThanOrEqual(1);
  }, 15000);

  it("GET /admin/ofertas/historial rechaza a un usuario sin rol admin", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/admin/ofertas/historial?estado=PUBLICADA",
      headers: { authorization: `Bearer ${autor.accessToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it("GET /admin/ofertas/historial devuelve la oferta aprobada con el admin que la moderó", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/admin/ofertas/historial?estado=PUBLICADA",
      headers: { authorization: `Bearer ${admin.accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    const ofertas = res.json().ofertas as { id: string; moderaciones: { moderador: { nombre: string } }[] }[];
    const oferta = ofertas.find((o) => o.id === ofertaAprobadaId);
    expect(oferta).toBeDefined();
    expect(oferta!.moderaciones[0]!.moderador.nombre).toBe("Admin Dashboard");
  }, 15000);

  it("POST /admin/comercios/enviar-promocion rechaza a un usuario sin rol admin", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/admin/comercios/enviar-promocion",
      headers: { authorization: `Bearer ${autor.accessToken}` },
      payload: { comercioIds: [comercioId], asunto: "Promo", mensaje: "Mensaje de prueba de promoción" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("POST /admin/comercios/enviar-promocion rechaza IDs que no existen", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/admin/comercios/enviar-promocion",
      headers: { authorization: `Bearer ${admin.accessToken}` },
      payload: {
        comercioIds: ["00000000-0000-0000-0000-000000000000"],
        asunto: "Promo",
        mensaje: "Mensaje de prueba de promoción",
      },
    });
    expect(res.statusCode).toBe(404);
  }, 15000);

  it("POST /admin/comercios/enviar-promocion envía la promo a los comercios seleccionados", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/admin/comercios/enviar-promocion",
      headers: { authorization: `Bearer ${admin.accessToken}` },
      payload: { comercioIds: [comercioId], asunto: "Promo", mensaje: "Mensaje de prueba de promoción" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true, enviados: 1 });
  }, 15000);
});
