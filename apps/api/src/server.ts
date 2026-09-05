import cron from "node-cron";
import { buildApp } from "./app.js";
import { env } from "./env.js";
import { expirarOfertasVencidas } from "./jobs/expirar-ofertas.js";
import { ocultarOfertasExpiradasViejas } from "./jobs/ocultar-expiradas.js";
import { enviarDigestPreferencias } from "./jobs/digest-preferencias.js";
import { enviarNotificacionesFavoritos } from "./jobs/notificaciones-favoritos.js";

const app = buildApp();

app
  .listen({ port: env.PORT, host: "0.0.0.0" })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });

// Job diario de expiración (ver 02-ARQUITECTURA.md §5). Corre a las 3am hora
// de Panamá; node-cron usa la zona horaria del proceso salvo que se indique.
cron.schedule("0 3 * * *", async () => {
  try {
    const count = await expirarOfertasVencidas();
    app.log.info({ count }, "job expirar-ofertas: ofertas expiradas");
  } catch (error) {
    app.log.error(error, "job expirar-ofertas falló");
  }
});

// Limpieza automática: ofertas que llevan 1+ día EXPIRADA se ocultan (nunca
// se borran, ver jobs/ocultar-expiradas.ts). Corre justo después del job de
// expiración de arriba.
cron.schedule("30 3 * * *", async () => {
  try {
    const count = await ocultarOfertasExpiradasViejas();
    app.log.info({ count }, "job ocultar-expiradas: ofertas ocultadas");
  } catch (error) {
    app.log.error(error, "job ocultar-expiradas falló");
  }
});

// Job semanal de digest de preferencias (ver Épica 9 / 05-ROADMAP.md Fase
// 8). Corre los lunes a las 8am hora de Panamá.
cron.schedule("0 8 * * 1", async () => {
  try {
    const resultado = await enviarDigestPreferencias();
    app.log.info(resultado, "job digest-preferencias: resumen enviado");
  } catch (error) {
    app.log.error(error, "job digest-preferencias falló");
  }
});

// Job diario de notificaciones por favorito (Épica 9). Corre a las 8am
// igual que el digest, pero todos los días — evalúa diaria/el día de la
// oferta/último día/1 día antes por cada Favorito (ver
// jobs/notificaciones-favoritos.ts).
cron.schedule("0 8 * * *", async () => {
  try {
    const resultado = await enviarNotificacionesFavoritos();
    app.log.info(resultado, "job notificaciones-favoritos: aviso enviado");
  } catch (error) {
    app.log.error(error, "job notificaciones-favoritos falló");
  }
});
