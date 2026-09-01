import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@ofertaspty/database";
import { Rol } from "@ofertaspty/shared-types";
import { buildApp } from "../src/app";
import { createTestUser } from "./helpers/test-user";

const solicitudBase = {
  nombre: "Comercio de Prueba",
  direccion: "Vía España, Panamá",
  ruc: "1-111-1111",
  direccionFiscal: "Vía España, Panamá",
  representanteLegal: "Juan Pérez",
  avisoOperacionesPath: "fake/aviso-de-prueba.pdf",
  terminosAceptados: true as const,
};

describe("/comercios", () => {
  let admin: Awaited<ReturnType<typeof createTestUser>>;
  let solicitante: Awaited<ReturnType<typeof createTestUser>>;
  let categoriaId: string;

  beforeAll(async () => {
    admin = await createTestUser({ role: Rol.ADMIN });
    solicitante = await createTestUser();
    const categoria = await prisma.categoria.findFirstOrThrow();
    categoriaId = categoria.id;

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
      headers: { authorization: `Bearer ${solicitante.accessToken}` },
      payload: { email: solicitante.email, nombre: "Solicitante Test" },
    });
  }, 40000);

  afterAll(async () => {
    await admin.cleanup();
    await solicitante.cleanup();
  }, 30000);

  it("rechaza sin token", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/comercios/solicitud",
      payload: { ...solicitudBase, categoriaId },
    });
    expect(res.statusCode).toBe(401);
  });

  it("crea una solicitud PENDIENTE y rechaza una segunda mientras siga pendiente", async () => {
    const app = buildApp();
    const primera = await app.inject({
      method: "POST",
      url: "/comercios/solicitud",
      headers: { authorization: `Bearer ${solicitante.accessToken}` },
      payload: { ...solicitudBase, categoriaId },
    });
    expect(primera.statusCode).toBe(201);
    expect(primera.json().comercio.estado).toBe("PENDIENTE");

    const segunda = await app.inject({
      method: "POST",
      url: "/comercios/solicitud",
      headers: { authorization: `Bearer ${solicitante.accessToken}` },
      payload: { ...solicitudBase, categoriaId },
    });
    expect(segunda.statusCode).toBe(409);
  }, 15000);

  it("GET /admin/comercios/pendientes rechaza a un usuario sin rol admin", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/admin/comercios/pendientes",
      headers: { authorization: `Bearer ${solicitante.accessToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it("POST /admin/comercios/:id/rechazar guarda el motivo y permite reenviar la solicitud", async () => {
    const app = buildApp();
    const comercio = await prisma.comercio.findFirstOrThrow({
      where: { usuarioId: (await prisma.usuario.findUniqueOrThrow({ where: { supabaseAuthId: solicitante.supabaseAuthId } })).id },
    });

    const rechazo = await app.inject({
      method: "POST",
      url: `/admin/comercios/${comercio.id}/rechazar`,
      headers: { authorization: `Bearer ${admin.accessToken}` },
      payload: { motivo: "Falta el aviso de operaciones vigente" },
    });
    expect(rechazo.statusCode).toBe(200);
    expect(rechazo.json().comercio.estado).toBe("RECHAZADO");

    const reenvio = await app.inject({
      method: "POST",
      url: "/comercios/solicitud",
      headers: { authorization: `Bearer ${solicitante.accessToken}` },
      payload: { ...solicitudBase, categoriaId },
    });
    expect(reenvio.statusCode).toBe(200);
    expect(reenvio.json().comercio.estado).toBe("PENDIENTE");
  }, 15000);

  it("POST /admin/comercios/:id/verificar promueve al usuario a rol COMERCIO", async () => {
    const app = buildApp();
    const usuario = await prisma.usuario.findUniqueOrThrow({
      where: { supabaseAuthId: solicitante.supabaseAuthId },
    });
    const comercio = await prisma.comercio.findUniqueOrThrow({ where: { usuarioId: usuario.id } });

    const res = await app.inject({
      method: "POST",
      url: `/admin/comercios/${comercio.id}/verificar`,
      headers: { authorization: `Bearer ${admin.accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().comercio.estado).toBe("VERIFICADO");

    const usuarioActualizado = await prisma.usuario.findUniqueOrThrow({ where: { id: usuario.id } });
    expect(usuarioActualizado.rol).toBe("COMERCIO");
  }, 15000);

  it("una oferta creada por el comercio verificado queda asociada automáticamente", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/ofertas",
      headers: { authorization: `Bearer ${solicitante.accessToken}` },
      payload: {
        titulo: "Oferta del comercio verificado",
        descripcion: "Descripción de prueba con más de diez caracteres",
        imagenUrl: "https://example.com/a.jpg",
        provincia: "Panamá",
        fechaInicio: new Date().toISOString(),
        fechaVencimiento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        categoriaId,
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().oferta.comercioId).not.toBeNull();
  }, 15000);

  it("al activar plan pago y aprobar la oferta, queda destacada automáticamente", async () => {
    const app = buildApp();
    const usuario = await prisma.usuario.findUniqueOrThrow({
      where: { supabaseAuthId: solicitante.supabaseAuthId },
    });
    const comercio = await prisma.comercio.findUniqueOrThrow({ where: { usuarioId: usuario.id } });

    await app.inject({
      method: "POST",
      url: `/admin/comercios/${comercio.id}/plan-pago`,
      headers: { authorization: `Bearer ${admin.accessToken}` },
    });

    const crearRes = await app.inject({
      method: "POST",
      url: "/ofertas",
      headers: { authorization: `Bearer ${solicitante.accessToken}` },
      payload: {
        titulo: "Oferta destacada del comercio",
        descripcion: "Descripción de prueba con más de diez caracteres",
        imagenUrl: "https://example.com/b.jpg",
        provincia: "Panamá",
        fechaInicio: new Date().toISOString(),
        fechaVencimiento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        categoriaId,
      },
    });
    const ofertaId = crearRes.json().oferta.id;

    const aprobarRes = await app.inject({
      method: "POST",
      url: `/admin/ofertas/${ofertaId}/aprobar`,
      headers: { authorization: `Bearer ${admin.accessToken}` },
    });
    expect(aprobarRes.statusCode).toBe(200);
    expect(aprobarRes.json().oferta.destacada).toBe(true);

    const destacadasRes = await app.inject({ method: "GET", url: "/ofertas/destacadas" });
    const ids = destacadasRes.json().ofertas.map((o: { id: string }) => o.id);
    expect(ids).toContain(ofertaId);
  }, 30000);

  // Regresión: verificar un comercio nunca debe pisar el rol del dueño,
  // ni siquiera cuando ese dueño es él mismo un ADMIN probando su propio
  // comercio (pasó de verdad en producción: un ADMIN perdió su rol al
  // verificar su propio comercio de prueba).
  it("verificar un comercio no le hace perder el rol ADMIN a su dueño", async () => {
    const adminDueno = await createTestUser({ role: Rol.ADMIN });
    try {
      const app = buildApp();
      await app.inject({
        method: "POST",
        url: "/auth/sync",
        headers: { authorization: `Bearer ${adminDueno.accessToken}` },
        payload: { email: adminDueno.email, nombre: "Admin Dueño Test" },
      });
      const usuarioAdminDueno = await prisma.usuario.findUniqueOrThrow({
        where: { supabaseAuthId: adminDueno.supabaseAuthId },
      });
      await prisma.usuario.update({
        where: { id: usuarioAdminDueno.id },
        data: { rol: Rol.ADMIN },
      });

      const solicitudRes = await app.inject({
        method: "POST",
        url: "/comercios/solicitud",
        headers: { authorization: `Bearer ${adminDueno.accessToken}` },
        payload: { ...solicitudBase, categoriaId },
      });
      const comercioId = solicitudRes.json().comercio.id;

      const verificarRes = await app.inject({
        method: "POST",
        url: `/admin/comercios/${comercioId}/verificar`,
        headers: { authorization: `Bearer ${admin.accessToken}` },
      });
      expect(verificarRes.statusCode).toBe(200);

      const usuarioTrasVerificar = await prisma.usuario.findUniqueOrThrow({
        where: { id: usuarioAdminDueno.id },
      });
      expect(usuarioTrasVerificar.rol).toBe("ADMIN");
    } finally {
      await adminDueno.cleanup();
    }
  }, 30000);

  it("POST /comercios/contactar-admin rechaza sin token", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/comercios/contactar-admin",
      payload: { asunto: "Consulta", mensaje: "Quiero empezar el plan pago" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("POST /comercios/contactar-admin rechaza si el usuario no tiene comercio", async () => {
    const sinComercio = await createTestUser();
    try {
      const app = buildApp();
      await app.inject({
        method: "POST",
        url: "/auth/sync",
        headers: { authorization: `Bearer ${sinComercio.accessToken}` },
        payload: { email: sinComercio.email, nombre: "Sin Comercio Test" },
      });

      const res = await app.inject({
        method: "POST",
        url: "/comercios/contactar-admin",
        headers: { authorization: `Bearer ${sinComercio.accessToken}` },
        payload: { asunto: "Consulta", mensaje: "Quiero empezar el plan pago" },
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().error).toBe("sin_comercio");
    } finally {
      await sinComercio.cleanup();
    }
  }, 20000);

  it("POST /comercios/contactar-admin envía el mensaje al admin", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/comercios/contactar-admin",
      headers: { authorization: `Bearer ${solicitante.accessToken}` },
      payload: { asunto: "Quiero el plan pago", mensaje: "Hola, ¿cómo arranco la afiliación?" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);
  }, 15000);

  it("PATCH /comercios/mi-logo rechaza sin token", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "PATCH",
      url: "/comercios/mi-logo",
      payload: { logoUrl: "https://example.com/logo.png" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("PATCH /comercios/mi-logo rechaza si el usuario no tiene comercio", async () => {
    const sinComercio = await createTestUser();
    try {
      const app = buildApp();
      await app.inject({
        method: "POST",
        url: "/auth/sync",
        headers: { authorization: `Bearer ${sinComercio.accessToken}` },
        payload: { email: sinComercio.email, nombre: "Sin Comercio Test" },
      });

      const res = await app.inject({
        method: "PATCH",
        url: "/comercios/mi-logo",
        headers: { authorization: `Bearer ${sinComercio.accessToken}` },
        payload: { logoUrl: "https://example.com/logo.png" },
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().error).toBe("sin_comercio");
    } finally {
      await sinComercio.cleanup();
    }
  }, 20000);

  it("PATCH /comercios/mi-logo guarda la URL del logo", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "PATCH",
      url: "/comercios/mi-logo",
      headers: { authorization: `Bearer ${solicitante.accessToken}` },
      payload: { logoUrl: "https://example.com/nuevo-logo.png" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().comercio.logoUrl).toBe("https://example.com/nuevo-logo.png");

    const usuario = await prisma.usuario.findUniqueOrThrow({
      where: { supabaseAuthId: solicitante.supabaseAuthId },
    });
    const comercio = await prisma.comercio.findUniqueOrThrow({ where: { usuarioId: usuario.id } });
    expect(comercio.logoUrl).toBe("https://example.com/nuevo-logo.png");
  }, 15000);

  it("PATCH /comercios/mi-logo rechaza una URL inválida", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "PATCH",
      url: "/comercios/mi-logo",
      headers: { authorization: `Bearer ${solicitante.accessToken}` },
      payload: { logoUrl: "no-es-una-url" },
    });
    expect(res.statusCode).toBe(500);
  }, 15000);
});
