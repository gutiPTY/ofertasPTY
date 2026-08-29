import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@ofertaspty/database";
import { Rol } from "@ofertaspty/shared-types";
import { buildApp } from "../src/app";
import { createTestUser } from "./helpers/test-user";

const sendEmailMock = vi.fn().mockResolvedValue(undefined);
vi.mock("../src/lib/email.js", () => ({ sendEmail: (...args: unknown[]) => sendEmailMock(...args) }));

// Import dinámico después del mock para que digest-preferencias.ts reciba
// el sendEmail mockeado (evita depender de si NODE_ENV=test lo no-opea,
// que además no nos deja ver a quién se le "habría" enviado el email).
const { enviarDigestPreferencias } = await import("../src/jobs/digest-preferencias");

describe("job digest-preferencias", () => {
  let admin: Awaited<ReturnType<typeof createTestUser>>;
  let autor: Awaited<ReturnType<typeof createTestUser>>;
  let suscriptorCategoria: Awaited<ReturnType<typeof createTestUser>>;
  let suscriptorProvincia: Awaited<ReturnType<typeof createTestUser>>;
  let suscriptorSinMatch: Awaited<ReturnType<typeof createTestUser>>;
  let categoriaId: string;
  let ofertaId: string;
  const provinciaOferta = "Darién";
  const provinciaSinMatch = "Guna Yala";

  beforeAll(async () => {
    admin = await createTestUser({ role: Rol.ADMIN });
    autor = await createTestUser();
    suscriptorCategoria = await createTestUser();
    suscriptorProvincia = await createTestUser();
    suscriptorSinMatch = await createTestUser();
    const categoria = await prisma.categoria.findFirstOrThrow();
    categoriaId = categoria.id;

    const app = buildApp();
    for (const [u, nombre] of [
      [admin, "Admin Digest"],
      [autor, "Autor Digest"],
      [suscriptorCategoria, "Suscriptor Categoria"],
      [suscriptorProvincia, "Suscriptor Provincia"],
      [suscriptorSinMatch, "Suscriptor Sin Match"],
    ] as const) {
      await app.inject({
        method: "POST",
        url: "/auth/sync",
        headers: { authorization: `Bearer ${u.accessToken}` },
        payload: { email: u.email, nombre },
      });
    }
    await prisma.usuario.update({
      where: { supabaseAuthId: admin.supabaseAuthId },
      data: { rol: Rol.ADMIN },
    });

    const crear = await app.inject({
      method: "POST",
      url: "/ofertas",
      headers: { authorization: `Bearer ${autor.accessToken}` },
      payload: {
        titulo: "Oferta para digest",
        descripcion: "Descripción de prueba con más de diez caracteres",
        imagenUrl: "https://example.com/a.jpg",
        provincia: provinciaOferta,
        fechaInicio: new Date().toISOString(),
        fechaVencimiento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        categoriaId,
      },
    });
    ofertaId = crear.json().oferta.id;

    await app.inject({
      method: "POST",
      url: `/admin/ofertas/${ofertaId}/aprobar`,
      headers: { authorization: `Bearer ${admin.accessToken}` },
    });

    // Preferencias: uno matchea por categoría, otro por provincia, otro no
    // matchea nada (para confirmar que no recibe el digest).
    await prisma.preferenciaUsuario.create({
      data: {
        usuarioId: (await prisma.usuario.findUniqueOrThrow({
          where: { supabaseAuthId: suscriptorCategoria.supabaseAuthId },
        })).id,
        categoriaId,
      },
    });
    await prisma.preferenciaUsuario.create({
      data: {
        usuarioId: (await prisma.usuario.findUniqueOrThrow({
          where: { supabaseAuthId: suscriptorProvincia.supabaseAuthId },
        })).id,
        provincia: provinciaOferta,
      },
    });
    await prisma.preferenciaUsuario.create({
      data: {
        usuarioId: (await prisma.usuario.findUniqueOrThrow({
          where: { supabaseAuthId: suscriptorSinMatch.supabaseAuthId },
        })).id,
        provincia: provinciaSinMatch,
      },
    });
  }, 40000);

  afterAll(async () => {
    await admin.cleanup();
    await autor.cleanup();
    await suscriptorCategoria.cleanup();
    await suscriptorProvincia.cleanup();
    await suscriptorSinMatch.cleanup();
  }, 30000);

  it("envía el digest solo a los suscriptores cuyas preferencias matchean (categoría o provincia)", async () => {
    sendEmailMock.mockClear();
    const resultado = await enviarDigestPreferencias();
    expect(resultado.usuariosNotificados).toBeGreaterThanOrEqual(2);

    const destinatarios = sendEmailMock.mock.calls.map((call) => (call[0] as { to: string }).to);
    expect(destinatarios).toContain(suscriptorCategoria.email);
    expect(destinatarios).toContain(suscriptorProvincia.email);
    expect(destinatarios).not.toContain(suscriptorSinMatch.email);
  }, 20000);
});
