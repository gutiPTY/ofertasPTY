import { prisma } from "@ofertaspty/database";
import { sendEmail } from "../lib/email.js";
import { emailDigestPreferencias } from "../lib/email-templates.js";

const DIAS_VENTANA = 7;

// Épica 9: resumen semanal por email con ofertas nuevas relevantes. No usa
// un cursor por usuario — como corre una vez por semana con cron, alcanza
// con mirar lo publicado en los últimos 7 días (ver Oferta.publicadaEn).
// Solo se les envía a usuarios que configuraron al menos una preferencia y
// que tienen al menos una oferta nueva que matchea (nunca un email vacío).
export async function enviarDigestPreferencias(): Promise<{
  usuariosNotificados: number;
  ofertasConsideradas: number;
}> {
  const desde = new Date(Date.now() - DIAS_VENTANA * 24 * 60 * 60 * 1000);

  const ofertas = await prisma.oferta.findMany({
    where: { estado: "PUBLICADA", publicadaEn: { gte: desde } },
    include: { categoria: true },
  });

  if (ofertas.length === 0) {
    return { usuariosNotificados: 0, ofertasConsideradas: 0 };
  }

  const usuarios = await prisma.usuario.findMany({
    where: { preferencias: { some: {} } },
    include: { preferencias: true },
  });

  let usuariosNotificados = 0;
  for (const usuario of usuarios) {
    const categoriaIds = new Set(
      usuario.preferencias.filter((p) => p.categoriaId).map((p) => p.categoriaId),
    );
    const provincias = new Set(
      usuario.preferencias.filter((p) => p.provincia).map((p) => p.provincia),
    );

    // Coincide con cualquiera de las dos listas (OR), no ambas a la vez —
    // decisión de negocio confirmada con el usuario en Fase 8.
    const coincidencias = ofertas.filter(
      (oferta) => categoriaIds.has(oferta.categoriaId) || provincias.has(oferta.provincia),
    );
    if (coincidencias.length === 0) continue;

    const { subject, html } = emailDigestPreferencias(coincidencias);
    await sendEmail({ to: usuario.email, subject, html });
    usuariosNotificados++;
  }

  return { usuariosNotificados, ofertasConsideradas: ofertas.length };
}
