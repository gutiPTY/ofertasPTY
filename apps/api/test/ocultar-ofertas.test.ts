import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@ofertaspty/database";
import { Rol } from "@ofertaspty/shared-types";
import { buildApp } from "../src/app";
import { createTestUser } from "./helpers/test-user";
import { ocultarOfertasExpiradasViejas } from "../src/jobs/ocultar-expiradas";

describe("job ocultar-expiradas", () => {
  let autor: Awaited<ReturnType<typeof createTestUser>>;
  let categoriaId: string;
  let ofertaViejaId: string;
  let ofertaRecienVencidaId: string;

  beforeAll(async () => {
    autor = await createTestUser();
    const categoria = await prisma.categoria.findFirstOrThrow();
    categoriaId = categoria.id;

    const app = buildApp();
    await app.inject({
      method: "POST",
      url: "/auth/sync",
      headers: { authorization: `Bearer ${autor.accessToken}` },
      payload: { email: autor.email, nombre: "Autor Test" },
    });

    async function crearExpirada(titulo: string, horasVencida: number) {
      const fechaVencimiento = new Date(Date.now() - horasVencida * 60 * 60 * 1000);
      const res = await app.inject({
        method: "POST",
        url: "/ofertas",
        headers: { authorization: `Bearer ${autor.accessToken}` },
        payload: {
          titulo,
          descripcion: "Descripción de prueba con más de diez caracteres",
          imagenUrl: "https://example.com/a.jpg",
          provincia: "Panamá",
          fechaInicio: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          fechaVencimiento: fechaVencimiento.toISOString(),
          categoriaId,
        },
      });
      const id = res.json().oferta.id as string;
      await prisma.oferta.update({
        where: { id },
        data: { estado: "EXPIRADA", fechaVencimiento },
      });
      return id;
    }

    ofertaViejaId = await crearExpirada("Oferta expirada hace 2 días", 48);
    ofertaRecienVencidaId = await crearExpirada("Oferta expirada hace 12 horas", 12);
  }, 40000);

  afterAll(async () => {
    await autor.cleanup();
  }, 30000);

  it("oculta las EXPIRADA de más de 1 día, no las recién vencidas", async () => {
    const count = await ocultarOfertasExpiradasViejas();
    expect(count).toBeGreaterThanOrEqual(1);

    const vieja = await prisma.oferta.findUniqueOrThrow({ where: { id: ofertaViejaId } });
    expect(vieja.oculta).toBe(true);
    expect(vieja.ocultaEn).not.toBeNull();

    const reciente = await prisma.oferta.findUniqueOrThrow({ where: { id: ofertaRecienVencidaId } });
    expect(reciente.oculta).toBe(false);
  });
});

describe("/admin/ofertas (todas + ocultar/mostrar)", () => {
  let admin: Awaited<ReturnType<typeof createTestUser>>;
  let autor: Awaited<ReturnType<typeof createTestUser>>;
  let ofertaId: string;
  let slug: string;

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

    const crear = await app.inject({
      method: "POST",
      url: "/ofertas",
      headers: { authorization: `Bearer ${autor.accessToken}` },
      payload: {
        titulo: "Oferta para ocultar",
        descripcion: "Descripción de prueba con más de diez caracteres",
        imagenUrl: "https://example.com/a.jpg",
        provincia: "Panamá",
        fechaInicio: new Date().toISOString(),
        fechaVencimiento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        categoriaId: categoria.id,
      },
    });
    ofertaId = crear.json().oferta.id;
    slug = crear.json().oferta.slug;

    await app.inject({
      method: "POST",
      url: `/admin/ofertas/${ofertaId}/aprobar`,
      headers: { authorization: `Bearer ${admin.accessToken}` },
    });
  }, 40000);

  afterAll(async () => {
    await admin.cleanup();
    await autor.cleanup();
  }, 30000);

  it("GET /admin/ofertas rechaza a un usuario sin rol admin", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/admin/ofertas",
      headers: { authorization: `Bearer ${autor.accessToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it("GET /admin/ofertas lista la oferta sin importar su estado", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/admin/ofertas",
      headers: { authorization: `Bearer ${admin.accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    const ids = res.json().ofertas.map((o: { id: string }) => o.id);
    expect(ids).toContain(ofertaId);
  });

  it("POST /admin/ofertas/:id/ocultar oculta la oferta, sin borrarla ni tocar su auditoría", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: `/admin/ofertas/${ofertaId}/ocultar`,
      headers: { authorization: `Bearer ${admin.accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().oferta.oculta).toBe(true);

    const feedRes = await app.inject({ method: "GET", url: "/ofertas" });
    const idsFeed = feedRes.json().ofertas.map((o: { id: string }) => o.id);
    expect(idsFeed).not.toContain(ofertaId);

    const detalleRes = await app.inject({ method: "GET", url: `/ofertas/${slug}` });
    expect(detalleRes.statusCode).toBe(404);

    const moderacion = await prisma.moderacion.findFirst({ where: { ofertaId } });
    expect(moderacion?.decision).toBe("PUBLICADA");
  }, 15000);

  it("POST /admin/ofertas/:id/mostrar la vuelve a mostrar", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: `/admin/ofertas/${ofertaId}/mostrar`,
      headers: { authorization: `Bearer ${admin.accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().oferta.oculta).toBe(false);

    const detalleRes = await app.inject({ method: "GET", url: `/ofertas/${slug}` });
    expect(detalleRes.statusCode).toBe(200);
  }, 15000);
});
