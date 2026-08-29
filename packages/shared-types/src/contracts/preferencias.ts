import { z } from "zod";
import { PROVINCIAS_PANAMA } from "../provincias";

// Épica 9 — el usuario reemplaza de una vez todas sus categorías/provincias
// favoritas (no hay edición incremental campo por campo).
export const GuardarPreferenciasInputSchema = z.object({
  categoriaIds: z.array(z.string().uuid()).max(20),
  provincias: z.array(z.enum(PROVINCIAS_PANAMA)).max(20),
});
export type GuardarPreferenciasInput = z.infer<typeof GuardarPreferenciasInputSchema>;
