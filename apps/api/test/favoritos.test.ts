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
  }, 40000);

  afterAll(async () => {
    await admin.cleanup();
    // Favorito se borra en cascada logica al borrar Oferta/Usuario del helper
    // solo si pertenece a esos usuarios; acá el favorito es del test-user
    // "usuario" y apunta a una oferta tambien de "usuario", asi que su propio
    // cleanup() ya lo cubre via el borrado de Oferta... pero Favorito no está
    // contemplado en test-user.cleanup(), así que se borra explícitamente.
    await prisma.favorito.deleteMany({ where: { ofertaId } });
    await usuario.cleanup();
  }, 30000);

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
  }, 15000);

  it("PUT /favoritos/:id/notificaciones actualiza y persiste, solo para el dueño", async () => {
    const app = buildApp();

    // El test anterior togglea dos veces, así que puede haber quedado
    // des-favoritado — asegura que el favorito exista antes de seguir.
    async function favoritoActual() {
      const listado = await app.inject({
        method: "GET",
        url: "/favoritos/mine",
        headers: { authorization: `Bearer ${usuario.accessToken}` },
      });
      return listado
        .json()
        .favoritos.find((f: { ofertaId: string }) => f.ofertaId === ofertaId) as
        | { id: string }
        | undefined;
    }

    let favorito = await favoritoActual();
    if (!favorito) {
      await app.inject({
        method: "POST",
        url: `/favoritos/${ofertaId}`,
        headers: { authorization: `Bearer ${usuario.accessToken}` },
      });
      favorito = await favoritoActual();
    }

    const payload = {
      notifEmail: true,
      notifInterna: true,
      notifDiaria: false,
      notifElDia: false,
      notifUltimoDia: true,
      notifUnDiaAntes: false,
    };

    const res = await app.inject({
      method: "PUT",
      url: `/favoritos/${favorito!.id}/notificaciones`,
      headers: { authorization: `Bearer ${usuario.accessToken}` },
      payload,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().favorito).toMatchObject(payload);

    const otro = await createTestUser();
    await app.inject({
      method: "POST",
      url: "/auth/sync",
      headers: { authorization: `Bearer ${otro.accessToken}` },
      payload: { email: otro.email, nombre: "Otro Usuario" },
    });
    const rechazo = await app.inject({
      method: "PUT",
      url: `/favoritos/${favorito!.id}/notificaciones`,
      headers: { authorization: `Bearer ${otro.accessToken}` },
      payload,
    });
    expect(rechazo.statusCode).toBe(404);
    await otro.cleanup();
  }, 60000);

  it("PUT /favoritos/:id/notificaciones rechaza sin token", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "PUT",
      url: `/favoritos/${ofertaId}/notificaciones`,
      payload: {},
    });
    expect(res.statusCode).toBe(401);
  });
});
