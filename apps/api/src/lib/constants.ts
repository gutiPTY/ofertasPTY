// Anti-flood: límite de ofertas simultáneas en estado PENDIENTE por usuario
// nuevo, hasta que gane "confianza" (ver 02-ARQUITECTURA.md §7).
export const MAX_OFERTAS_PENDIENTES_POR_USUARIO = 5;

// Umbral de reportes que mueve automáticamente una oferta PUBLICADA a
// EN_REVISION (ver 03-MODELO-DE-DATOS.md "Umbral de reportes").
export const REPORTES_PARA_REVISION = 10;

// Épica 5 — bucket privado donde se guardan los documentos de
// verificación de comercio (aviso de operaciones). Nunca se sirve por
// URL pública, solo por URL firmada de corta duración.
export const COMERCIO_DOCS_BUCKET = "comercio-docs";
export const COMERCIO_DOC_SIGNED_URL_SECONDS = 5 * 60;
