import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@ofertaspty/database";
import { Rol } from "@ofertaspty/shared-types";
import { buildApp } from "../src/app";
import { createTestUser } from "./helpers/test-user";

describe("/favoritos", () => {
  let admin: Awaited<ReturnType<typeof createTestUser>>;
  let usuario: Awaited<ReturnType<typeof createTestUser>>;
  let ofertaId: string;

  beforeAll(async () => {
    admin = await createTestUser({ role: Rol.ADMIN });
    usuario = await createTestUser();
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
      headers: { authorization: `Bearer ${usuario.accessToken}` },
      payload: { email: usuario.email, nombre: "Usuario Test" },
    });

    const crearRes = await app.inject({
      method: "POST",
      url: "/ofertas",
      headers: { authorization: `Bearer ${usuario.accessToken}` },
      payload: {
        titulo: "Oferta para favoritos",
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
  }, 15000);

  afterAll(async () => {
    await admin.cleanup();
    // Favorito se borra en cascada logica al borrar Oferta/Usuario del helper
    // solo si pertenece a esos usuarios; acá el favorito es del test-user
    // "usuario" y apunta a una oferta tambien de "usuario", asi que su propio
    // cleanup() ya lo cubre via el borrado de Oferta... pero Favorito no está
    // contemplado en test-user.cleanup(), así que se borra explícitamente.
    await prisma.favorito.deleteMany({ where: { ofertaId } });
    await usuario.cleanup();
  });

  it("POST /favoritos/:ofertaId rechaza sin token", async () => {
    const app = buildApp();
    const res = await app.inject({ method: "POST", url: `/favoritos/${ofertaId}` });
    expect(res.statusCode).toBe(401);
  });

  it("POST /favoritos/:ofertaId togglea el favorito", async () => {
    const app = buildApp();

    const primero = await app.inject({
      method: "POST",
      url: `/favoritos/${ofertaId}`,
      headers: { authorization: `Bearer ${usuario.accessToken}` },
    });
    expect(primero.statusCode).toBe(200);
    expect(primero.json().favorito).toBe(true);

    const listado = await app.inject({
      method: "GET",
      url: "/favoritos/mine",
      headers: { authorization: `Bearer ${usuario.accessToken}` },
    });
    expect(listado.json().favoritos.some((f: { ofertaId: string }) => f.ofertaId === ofertaId)).toBe(
      true,
    );

    const segundo = await app.inject({
      method: "POST",
      url: `/favoritos/${ofertaId}`,
      headers: { authorization: `Bearer ${usuario.accessToken}` },
    });
    expect(segundo.statusCode).toBe(200);
    expect(segundo.json().favorito).toBe(false);
  });
});
