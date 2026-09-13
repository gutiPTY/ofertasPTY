import { env } from "../env.js";

// Paleta de marca (mismos tokens que apps/web/app/globals.css). Sin
// imágenes externas ni @font-face: la mayoría de los clientes de correo
// los bloquean o los ignoran, así que se usa una pila de fuentes de
// sistema y color plano para que la marca se vea igual en todos.
const COLOR_EMBER = "#d6401f";
const COLOR_EMBER_INK = "#ffffff";
const COLOR_INK = "#1b1512";
const COLOR_MUTED = "#7a6f61";
const COLOR_PAPER = "#fbf7f1";
const COLOR_SURFACE = "#f3ebe0";
const COLOR_LINE = "#e3d6c3";
const FUENTE = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function layout(titulo: string, cuerpoHtml: string) {
  return `
    <div style="background: ${COLOR_SURFACE}; padding: 32px 16px; font-family: ${FUENTE};">
      <div style="max-width: 480px; margin: 0 auto; background: ${COLOR_PAPER}; border-radius: 16px; overflow: hidden; border: 1px solid ${COLOR_LINE};">
        <div style="background: ${COLOR_EMBER}; padding: 20px 24px;">
          <span style="font-size: 20px; font-weight: 700; color: ${COLOR_EMBER_INK};">
            🔥 Encuentra Ofertas PTY
          </span>
        </div>
        <div style="padding: 28px 24px; color: ${COLOR_INK};">
          <h2 style="margin: 0 0 12px; font-size: 20px; color: ${COLOR_INK};">${titulo}</h2>
          <div style="font-size: 15px; line-height: 1.5;">${cuerpoHtml}</div>
        </div>
        <div style="padding: 16px 24px; border-top: 1px solid ${COLOR_LINE};">
          <p style="margin: 0; font-size: 12px; color: ${COLOR_MUTED};">
            Encuentra Ofertas PTY — Panamá ·
            <a href="${env.WEB_URL}/contacto" style="color: ${COLOR_MUTED};">Contacto</a>
          </p>
        </div>
      </div>
    </div>
  `;
}

function boton(href: string, texto: string) {
  return `
    <a href="${href}" style="display: inline-block; margin-top: 8px; padding: 10px 20px; background: ${COLOR_EMBER}; color: ${COLOR_EMBER_INK}; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 999px;">
      ${texto}
    </a>
  `;
}

function enlace(href: string, texto: string) {
  return `<a href="${href}" style="color: ${COLOR_EMBER}; font-weight: 600; text-decoration: none;">${texto}</a>`;
}

export function emailOfertaAprobada(oferta: { titulo: string; slug: string }) {
  return {
    subject: `Tu oferta "${oferta.titulo}" fue aprobada`,
    html: layout(
      "¡Tu oferta ya está publicada!",
      `
        <p>Un administrador revisó y aprobó tu oferta <strong>${oferta.titulo}</strong>. Ya está visible en el feed público.</p>
        <p>${boton(`${env.WEB_URL}/ofertas/${oferta.slug}`, "Ver la oferta")}</p>
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
        <p>${boton(`${env.WEB_URL}/publicar`, "Publicar otra oferta")}</p>
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
        <ul style="padding-left: 20px; margin: 0;">${filas}</ul>
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
          ${enlace(`${env.WEB_URL}/ofertas/${oferta.slug}`, oferta.titulo)}
          <br />
          <span style="font-size: 13px; color: ${COLOR_MUTED};">
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
        <ul style="padding-left: 20px; margin: 0;">${filas}</ul>
        <p style="font-size: 12px; color: ${COLOR_MUTED};">
          Podés cambiar tus categorías/provincias favoritas desde tu perfil en cualquier momento.
        </p>
      `,
    ),
  };
}

// Épica 5 — el comercio escribe texto libre, a diferencia del resto de los
// templates (títulos, motivos cortos ya validados por otros flujos) — hay
// que escapar antes de interpolar en el HTML del email.
function escapeHtml(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function emailComercioContactoAdmin(
  comercio: { nombre: string },
  usuario: { nombre: string; email: string },
  asunto: string,
  mensaje: string,
) {
  const mensajeHtml = escapeHtml(mensaje).replace(/\n/g, "<br />");
  return {
    subject: `[Mi comercio] ${escapeHtml(asunto)} — ${comercio.nombre}`,
    html: layout(
      "Mensaje de un comercio",
      `
        <p>
          <strong>${escapeHtml(comercio.nombre)}</strong> (${escapeHtml(usuario.nombre)},
          ${escapeHtml(usuario.email)}) escribió:
        </p>
        <p style="white-space: pre-line; border-left: 3px solid ${COLOR_LINE}; padding-left: 12px;">
          ${mensajeHtml}
        </p>
        <p style="font-size: 12px; color: ${COLOR_MUTED};">Podés responder directo a este correo.</p>
      `,
    ),
  };
}

// Épica 5 (panel admin) — el admin le manda una promo a uno o varios
// comercios verificados desde /admin. Igual que emailComercioContactoAdmin,
// el mensaje es texto libre así que hay que escaparlo; a diferencia de ese,
// el asunto SÍ es el asunto real del email (no un prefijo armado acá), así
// que no se escapa — es un header de texto plano, no HTML.
export function emailPromocionComercio(asunto: string, mensaje: string) {
  const mensajeHtml = escapeHtml(mensaje).replace(/\n/g, "<br />");
  return {
    subject: asunto,
    html: layout(asunto, `<p style="white-space: pre-line;">${mensajeHtml}</p>`),
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
          ${enlace(`${env.WEB_URL}/ofertas/${item.slug}`, item.titulo)}
          <br />
          <span style="font-size: 13px; color: ${COLOR_MUTED};">${item.motivo}</span>
        </li>
      `,
    )
    .join("");

  return {
    subject: `${items.length} de tus favoritos ${items.length === 1 ? "tiene" : "tienen"} novedades hoy`,
    html: layout(
      "Novedades de tus ofertas favoritas",
      `
        <ul style="padding-left: 20px; margin: 0;">${filas}</ul>
        <p style="font-size: 12px; color: ${COLOR_MUTED};">
          Podés cambiar cuándo y cómo te avisamos de cada favorito desde
          ${enlace(`${env.WEB_URL}/favoritos`, "/favoritos")}.
        </p>
      `,
    ),
  };
}

function formatear(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") return "(vacío)";
  return String(valor);
}
