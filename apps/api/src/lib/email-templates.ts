import { env } from "../env.js";

function layout(titulo: string, cuerpoHtml: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
      <h2 style="margin-bottom: 4px;">${titulo}</h2>
      ${cuerpoHtml}
      <p style="margin-top: 24px; font-size: 12px; color: #666;">
        Encuentra Ofertas PTY
      </p>
    </div>
  `;
}

export function emailOfertaAprobada(oferta: { titulo: string; slug: string }) {
  return {
    subject: `Tu oferta "${oferta.titulo}" fue aprobada`,
    html: layout(
      "¡Tu oferta ya está publicada!",
      `
        <p>Un administrador revisó y aprobó tu oferta <strong>${oferta.titulo}</strong>. Ya está visible en el feed público.</p>
        <p><a href="${env.WEB_URL}/ofertas/${oferta.slug}">Ver la oferta</a></p>
      `,
    ),
  };
}

export function emailOfertaRechazada(oferta: { titulo: string }, motivo?: string) {
  return {
    subject: `Tu oferta "${oferta.titulo}" fue rechazada`,
    html: layout(
      "Tu oferta no fue aprobada",
      `
        <p>Un administrador revisó tu oferta <strong>${oferta.titulo}</strong> y decidió no publicarla.</p>
        ${motivo ? `<p><strong>Motivo:</strong> ${motivo}</p>` : ""}
        <p>Podés corregirla y publicar una nueva si querés volver a intentarlo.</p>
      `,
    ),
  };
}

const ETIQUETAS_CAMPO: Record<string, string> = {
  titulo: "Título",
  descripcion: "Descripción",
  imagenUrl: "Imagen",
  precioOriginal: "Precio original",
  precioOferta: "Precio oferta",
  provincia: "Provincia",
  distrito: "Distrito",
  direccion: "Dirección",
  linkExterno: "Link externo",
  fechaInicio: "Vigencia desde",
  fechaVencimiento: "Vigencia hasta",
  categoriaId: "Categoría",
  diaSemana: "Día específico",
};

export function emailOfertaEditada(oferta: { titulo: string }, cambios: Record<string, { anterior: unknown; nuevo: unknown }>) {
  const filas = Object.entries(cambios)
    .map(
      ([campo, { anterior, nuevo }]) =>
        `<li><strong>${ETIQUETAS_CAMPO[campo] ?? campo}:</strong> ${formatear(anterior)} → ${formatear(nuevo)}</li>`,
    )
    .join("");

  return {
    subject: `Un administrador editó tu oferta "${oferta.titulo}"`,
    html: layout(
      "Tu oferta fue editada por un administrador",
      `
        <p>Antes de decidir sobre tu oferta <strong>${oferta.titulo}</strong>, un administrador corrigió los siguientes datos:</p>
        <ul>${filas}</ul>
      `,
    ),
  };
}

interface OfertaDigest {
  titulo: string;
  slug: string;
  precioOferta: unknown;
  precioOriginal: unknown;
  categoria: { nombre: string };
  provincia: string;
}

export function emailDigestPreferencias(ofertas: OfertaDigest[]) {
  const filas = ofertas
    .map(
      (oferta) => `
        <li style="margin-bottom: 12px;">
          <a href="${env.WEB_URL}/ofertas/${oferta.slug}"><strong>${oferta.titulo}</strong></a>
          <br />
          <span style="font-size: 13px; color: #444;">
            ${oferta.categoria.nombre} · ${oferta.provincia}
            ${oferta.precioOferta ? ` · $${oferta.precioOferta}` : ""}
          </span>
        </li>
      `,
    )
    .join("");

  return {
    subject: `${ofertas.length} oferta${ofertas.length === 1 ? "" : "s"} nueva${ofertas.length === 1 ? "" : "s"} para vos esta semana`,
    html: layout(
      "Ofertas de la semana según tus preferencias",
      `
        <p>Estas son las ofertas publicadas esta semana en tus categorías o provincias favoritas:</p>
        <ul style="padding-left: 20px;">${filas}</ul>
        <p style="font-size: 12px; color: #888;">
          Podés cambiar tus categorías/provincias favoritas desde tu perfil en cualquier momento.
        </p>
      `,
    ),
  };
}

interface FavoritoNotificable {
  titulo: string;
  slug: string;
  motivo: string;
}

// Épica 9 — job diario de notificaciones por favorito (ver
// jobs/notificaciones-favoritos.ts). Un solo email agrupado por usuario,
// aunque tenga varios favoritos con aviso hoy, para no mandar uno por
// oferta (decisión de negocio confirmada con el usuario).
export function emailNotificacionesFavoritos(items: FavoritoNotificable[]) {
  const filas = items
    .map(
      (item) => `
        <li style="margin-bottom: 12px;">
          <a href="${env.WEB_URL}/ofertas/${item.slug}"><strong>${item.titulo}</strong></a>
          <br />
          <span style="font-size: 13px; color: #444;">${item.motivo}</span>
        </li>
      `,
    )
    .join("");

  return {
    subject: `${items.length} de tus favoritos ${items.length === 1 ? "tiene" : "tienen"} novedades hoy`,
    html: layout(
      "Novedades de tus ofertas favoritas",
      `
        <ul style="padding-left: 20px;">${filas}</ul>
        <p style="font-size: 12px; color: #888;">
          Podés cambiar cuándo y cómo te avisamos de cada favorito desde /favoritos.
        </p>
      `,
    ),
  };
}

function formatear(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") return "(vacío)";
  return String(valor);
}
