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
});
