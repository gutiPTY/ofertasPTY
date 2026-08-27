// Anti-flood: límite de ofertas simultáneas en estado PENDIENTE por usuario
// nuevo, hasta que gane "confianza" (ver 02-ARQUITECTURA.md §7).
export const MAX_OFERTAS_PENDIENTES_POR_USUARIO = 5;

// Umbral de reportes que mueve automáticamente una oferta PUBLICADA a
// EN_REVISION (ver 03-MODELO-DE-DATOS.md "Umbral de reportes").
export const REPORTES_PARA_REVISION = 10;
