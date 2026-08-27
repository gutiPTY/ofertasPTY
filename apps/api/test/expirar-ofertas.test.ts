import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@ofertaspty/database";
import { Rol } from "@ofertaspty/shared-types";
import { buildApp } from "../src/app";
import { createTestUser } from "./helpers/test-user";
import { expirarOfertasVencidas } from "../src/jobs/expirar-ofertas";

describe("job expirar-ofertas", () => {
  let admin: Awaited<ReturnType<typeof createTestUser>>;
  let autor: Awaited<ReturnType<typeof createTestUser>>;
  let ofertaVencidaId: string;
  let ofertaPendienteVencidaId: string;

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

    const fechaInicio = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const fechaVencimiento = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

    const crearVencida = await app.inject({
      method: "POST",
      url: "/ofertas",
      headers: { authorization: `Bearer ${autor.accessToken}` },
      payload: {
        titulo: "Oferta ya vencida",
        descripcion: "Descripción de prueba con más de diez caracteres",
        imagenUrl: "https://example.com/a.jpg",
        provincia: "Panamá",
        fechaInicio: fechaInicio.toISOString(),
        fechaVencimiento: fechaVencimiento.toISOString(),
        categoriaId: categoria.id,
      },
    });
    ofertaVencidaId = crearVencida.json().oferta.id;
    await app.inject({
      method: "POST",
      url: `/admin/ofertas/${ofertaVencidaId}/aprobar`,
      headers: { authorization: `Bearer ${admin.accessToken}` },
    });

    const crearPendiente = await app.inject({
      method: "POST",
      url: "/ofertas",
      headers: { authorization: `Bearer ${autor.accessToken}` },
      payload: {
        titulo: "Oferta pendiente con fecha vencida",
        descripcion: "Descripción de prueba con más de diez caracteres",
        imagenUrl: "https://example.com/a.jpg",
        provincia: "Panamá",
        fechaInicio: fechaInicio.toISOString(),
        fechaVencimiento: fechaVencimiento.toISOString(),
        categoriaId: categoria.id,
      },
    });
    ofertaPendienteVencidaId = crearPendiente.json().oferta.id;
  }, 40000);

  afterAll(async () => {
    await admin.cleanup();
    await autor.cleanup();
  }, 30000);

  it("cambia a EXPIRADA solo las ofertas PUBLICADA vencidas, no las PENDIENTE", async () => {
    const count = await expirarOfertasVencidas();
    expect(count).toBeGreaterThanOrEqual(1);

    const vencida = await prisma.oferta.findUniqueOrThrow({ where: { id: ofertaVencidaId } });
    expect(vencida.estado).toBe("EXPIRADA");

    const pendiente = await prisma.oferta.findUniqueOrThrow({
      where: { id: ofertaPendienteVencidaId },
    });
    expect(pendiente.estado).toBe("PENDIENTE");
  });
});
