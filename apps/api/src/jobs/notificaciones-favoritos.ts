import { prisma } from "@ofertaspty/database";
import type { DiaSemana } from "@ofertaspty/shared-types";
import { sendEmail } from "../lib/email.js";
import { emailNotificacionesFavoritos } from "../lib/email-templates.js";

// Mismo criterio timezone-naive (reloj/UTC del proceso) que ya usa
// jobs/expirar-ofertas.ts — no shifteamos a hora de Panamá acá para no
// introducir una noción de "hoy" distinta a la que ya usa el resto del
// sistema para decidir cuándo una oferta expira.
const DIA_SEMANA_POR_INDICE: DiaSemana[] = [
  "DOMINGO",
  "LUNES",
  "MARTES",
  "MIERCOLES",
  "JUEVES",
  "VIERNES",
  "SABADO",
] as DiaSemana[];

function soloFecha(fecha: Date): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
}

function mismoDia(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

interface EventoNotificacion {
  usuarioId: string;
  notifEmail: boolean;
  notifInterna: boolean;
  oferta: { titulo: string; slug: string };
  motivo: string;
}

// Épica 9 — job diario que evalúa las 4 opciones de "momento" por
// favorito (diaria / el día de la oferta / último día / 1 día antes) y
// dispara email agrupado y/o notificaciones internas individuales según
// lo que cada favorito tenga activado (ver Favorito.notif* en el schema).
export async function enviarNotificacionesFavoritos(): Promise<{
  usuariosNotificadosEmail: number;
  notificacionesInternasCreadas: number;
  favoritosEvaluados: number;
}> {
  const hoy = soloFecha(new Date());
  const diaSemanaHoy = DIA_SEMANA_POR_INDICE[new Date().getUTCDay()];

  // "Último día"/"1 día antes" tienen que poder disparar aunque el job
  // diario de expirar-ofertas ya haya pasado la oferta a EXPIRADA el mismo
  // día calendario (el orden entre ambos cron no está garantizado) — para
  // esos dos momentos no exigimos PUBLICADA, se filtra más abajo.
  const favoritos = await prisma.favorito.findMany({
    where: {
      oferta: { estado: { in: ["PUBLICADA", "EXPIRADA"] } },
      OR: [
        { notifDiaria: true },
        { notifElDia: true },
        { notifUltimoDia: true },
        { notifUnDiaAntes: true },
      ],
    },
    include: { oferta: true },
  });

  const eventos: EventoNotificacion[] = [];

  for (const favorito of favoritos) {
    if (!favorito.notifEmail && !favorito.notifInterna) continue;

    const { oferta } = favorito;
    const vencimiento = soloFecha(oferta.fechaVencimiento);
    const motivos: string[] = [];

    if (favorito.notifDiaria && oferta.estado === "PUBLICADA") {
      motivos.push("Recordatorio diario de tu favorito.");
    }
    if (favorito.notifElDia && oferta.estado === "PUBLICADA" && oferta.diaSemana === diaSemanaHoy) {
      motivos.push("Hoy es el día de esta promo.");
    }
    if (favorito.notifUltimoDia && mismoDia(vencimiento, hoy)) {
      motivos.push("Hoy es el último día para aprovecharla.");
    }
    if (favorito.notifUnDiaAntes) {
      const diaAntes = new Date(vencimiento.getTime() - 24 * 60 * 60 * 1000);
      if (mismoDia(diaAntes, hoy)) {
        motivos.push("Vence mañana.");
      }
    }

    if (motivos.length === 0) continue;

    eventos.push({
      usuarioId: favorito.usuarioId,
      notifEmail: favorito.notifEmail,
      notifInterna: favorito.notifInterna,
      oferta: { titulo: oferta.titulo, slug: oferta.slug },
      motivo: motivos.join(" "),
    });
  }

  if (eventos.length === 0) {
    return { usuariosNotificadosEmail: 0, notificacionesInternasCreadas: 0, favoritosEvaluados: favoritos.length };
  }

  // Interna: una fila por evento — entradas granulares en el dropdown de
  // la campana, a diferencia del email que sí se agrupa (ver más abajo).
  const internas = eventos.filter((evento) => evento.notifInterna);
  if (internas.length > 0) {
    await prisma.notificacion.createMany({
      data: internas.map((evento) => ({
        usuarioId: evento.usuarioId,
        mensaje: `${evento.oferta.titulo}: ${evento.motivo}`,
        ofertaSlug: evento.oferta.slug,
      })),
    });
  }

  // Email: un solo mensaje agrupado por usuario, aunque tenga varios
  // favoritos con aviso hoy (decisión de negocio confirmada con el
  // usuario, para no mandar uno por oferta).
  const eventosPorUsuario = new Map<string, EventoNotificacion[]>();
  for (const evento of eventos.filter((e) => e.notifEmail)) {
    const lista = eventosPorUsuario.get(evento.usuarioId) ?? [];
    lista.push(evento);
    eventosPorUsuario.set(evento.usuarioId, lista);
  }

  let usuariosNotificadosEmail = 0;
  for (const [usuarioId, eventosUsuario] of eventosPorUsuario) {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) continue;

    const { subject, html } = emailNotificacionesFavoritos(
      eventosUsuario.map((evento) => ({
        titulo: evento.oferta.titulo,
        slug: evento.oferta.slug,
        motivo: evento.motivo,
      })),
    );
    await sendEmail({ to: usuario.email, subject, html });
    usuariosNotificadosEmail++;
  }

  return {
    usuariosNotificadosEmail,
    notificacionesInternasCreadas: internas.length,
    favoritosEvaluados: favoritos.length,
  };
}
