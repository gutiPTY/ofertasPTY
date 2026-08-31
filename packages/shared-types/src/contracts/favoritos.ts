import { z } from "zod";

// Épica 9 — vía y momento de notificación de un favorito puntual. PUT
// reemplaza los 6 flags de una vez (mismo patrón que preferencias de
// perfil), no hay edición incremental campo por campo.
export const ActualizarNotificacionFavoritoInputSchema = z.object({
  notifEmail: z.boolean(),
  notifInterna: z.boolean(),
  notifDiaria: z.boolean(),
  notifElDia: z.boolean(),
  notifUltimoDia: z.boolean(),
  notifUnDiaAntes: z.boolean(),
});
export type ActualizarNotificacionFavoritoInput = z.infer<
  typeof ActualizarNotificacionFavoritoInputSchema
>;
