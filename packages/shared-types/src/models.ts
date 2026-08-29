import type { Rol, EstadoOferta, EstadoComercio } from "./enums";

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  suspendido: boolean;
  reputacion: number;
  creadoEn: string;
}

export interface Comercio {
  id: string;
  nombre: string;
  categoriaId: string;
  usuarioId: string;
  direccion: string;
  ruc: string;
  direccionFiscal: string;
  representanteLegal: string;
  estado: EstadoComercio;
  motivoRechazo: string | null;
  planPago: boolean;
  terminosAceptadosEn: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Categoria {
  id: string;
  nombre: string;
}

export interface Oferta {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string;
  imagenUrl: string;
  precioOriginal: string | null;
  precioOferta: string | null;
  provincia: string;
  distrito: string | null;
  direccion: string | null;
  linkExterno: string | null;
  fechaInicio: string;
  fechaVencimiento: string;
  estado: EstadoOferta;
  destacada: boolean;
  categoriaId: string;
  comercioId: string | null;
  creadoPorId: string;
  creadoEn: string;
  actualizadoEn: string;
}
