import cron from "node-cron";
import { buildApp } from "./app";
import { env } from "./env";
import { expirarOfertasVencidas } from "./jobs/expirar-ofertas";

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
