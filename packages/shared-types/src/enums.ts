// Espejo manual de los enums de packages/database/prisma/schema.prisma.
// Ninguna app aparte de apps/api depende de @ofertaspty/database, así que
// estos valores se mantienen a mano en sincronía con el schema.

export const Rol = {
  USUARIO: "USUARIO",
  COMERCIO: "COMERCIO",
  ADMIN: "ADMIN",
} as const;
export type Rol = (typeof Rol)[keyof typeof Rol];

export const EstadoOferta = {
  PENDIENTE: "PENDIENTE",
  PUBLICADA: "PUBLICADA",
  RECHAZADA: "RECHAZADA",
  EXPIRADA: "EXPIRADA",
  EN_REVISION: "EN_REVISION",
} as const;
export type EstadoOferta = (typeof EstadoOferta)[keyof typeof EstadoOferta];

export const EstadoComercio = {
  PENDIENTE: "PENDIENTE",
  VERIFICADO: "VERIFICADO",
  RECHAZADO: "RECHAZADO",
} as const;
export type EstadoComercio = (typeof EstadoComercio)[keyof typeof EstadoComercio];

// Épica 9 — solo tiene sentido para promos recurrentes de un día fijo a la
// semana (ej. "Miércoles de Descuento"); independiente de
// fechaInicio/fechaVencimiento, que modelan el rango de vigencia general.
export const DiaSemana = {
  LUNES: "LUNES",
  MARTES: "MARTES",
  MIERCOLES: "MIERCOLES",
  JUEVES: "JUEVES",
  VIERNES: "VIERNES",
  SABADO: "SABADO",
  DOMINGO: "DOMINGO",
} as const;
export type DiaSemana = (typeof DiaSemana)[keyof typeof DiaSemana];

export const DIAS_SEMANA_ORDEN: DiaSemana[] = [
  DiaSemana.LUNES,
  DiaSemana.MARTES,
  DiaSemana.MIERCOLES,
  DiaSemana.JUEVES,
  DiaSemana.VIERNES,
  DiaSemana.SABADO,
  DiaSemana.DOMINGO,
];

export const DIA_SEMANA_LABEL: Record<DiaSemana, string> = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};
