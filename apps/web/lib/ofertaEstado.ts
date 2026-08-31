export type EstadoOferta = "PENDIENTE" | "PUBLICADA" | "RECHAZADA" | "EXPIRADA" | "EN_REVISION";

export const ESTADO_LABEL: Record<EstadoOferta, string> = {
  PENDIENTE: "Pendiente",
  EN_REVISION: "En revisión",
  PUBLICADA: "Publicada",
  RECHAZADA: "Rechazada",
  EXPIRADA: "Expirada",
};

export const ESTADO_BADGE: Record<EstadoOferta, string> = {
  PENDIENTE: "bg-warning-bg text-warning",
  EN_REVISION: "bg-warning-bg text-warning",
  PUBLICADA: "bg-success-bg text-success",
  RECHAZADA: "bg-critical-bg text-critical",
  EXPIRADA: "bg-surface-2 text-muted",
};
