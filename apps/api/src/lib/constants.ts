// Anti-flood: límite de ofertas simultáneas en estado PENDIENTE por usuario
// nuevo, hasta que gane "confianza" (ver 02-ARQUITECTURA.md §7).
export const MAX_OFERTAS_PENDIENTES_POR_USUARIO = 5;
