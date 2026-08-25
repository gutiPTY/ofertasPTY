import { z } from "zod";
import { PROVINCIAS_PANAMA } from "../provincias";

export const CrearOfertaInputSchema = z
  .object({
    titulo: z.string().min(3).max(120),
    descripcion: z.string().min(10).max(2000),
    imagenUrl: z.string().url(),
    precioOriginal: z.coerce.number().positive().optional(),
    precioOferta: z.coerce.number().positive().optional(),
    provincia: z.enum(PROVINCIAS_PANAMA),
    distrito: z.string().min(1).max(120).optional(),
    direccion: z.string().min(1).max(255).optional(),
    linkExterno: z.string().url().optional(),
    fechaInicio: z.coerce.date(),
    fechaVencimiento: z.coerce.date(),
    categoriaId: z.string().uuid(),
  })
  .refine((data) => data.fechaVencimiento > data.fechaInicio, {
    message: "fechaVencimiento debe ser posterior a fechaInicio",
    path: ["fechaVencimiento"],
  });
export type CrearOfertaInput = z.infer<typeof CrearOfertaInputSchema>;

export const ModerarOfertaInputSchema = z.object({
  motivo: z.string().min(1).max(500).optional(),
});
export type ModerarOfertaInput = z.infer<typeof ModerarOfertaInputSchema>;

export const FEED_PAGE_SIZE = 12;

export const FiltrosFeedSchema = z.object({
  categoriaId: z.string().uuid().optional(),
  provincia: z.enum(PROVINCIAS_PANAMA).optional(),
  q: z.string().min(1).max(120).optional(),
  page: z.coerce.number().int().positive().default(1),
});
export type FiltrosFeed = z.infer<typeof FiltrosFeedSchema>;
