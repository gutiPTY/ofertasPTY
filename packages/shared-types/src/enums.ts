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
