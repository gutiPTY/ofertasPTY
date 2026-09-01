import { z } from "zod";

export const CrearSolicitudComercioInputSchema = z.object({
  nombre: z.string().min(2).max(120),
  categoriaId: z.string().uuid(),
  direccion: z.string().min(3).max(255),
  ruc: z.string().min(3).max(50),
  direccionFiscal: z.string().min(3).max(255),
  representanteLegal: z.string().min(3).max(120),
  avisoOperacionesPath: z.string().min(1),
  terminosAceptados: z.literal(true, {
    errorMap: () => ({ message: "Debés aceptar los Términos y Condiciones" }),
  }),
});
export type CrearSolicitudComercioInput = z.infer<typeof CrearSolicitudComercioInputSchema>;

export const RechazarComercioInputSchema = z.object({
  motivo: z.string().min(3).max(500),
});
export type RechazarComercioInput = z.infer<typeof RechazarComercioInputSchema>;

export const ContactarAdminInputSchema = z.object({
  asunto: z.string().min(3).max(150),
  mensaje: z.string().min(10).max(3000),
});
export type ContactarAdminInput = z.infer<typeof ContactarAdminInputSchema>;
