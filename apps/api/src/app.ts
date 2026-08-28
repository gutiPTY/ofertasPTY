import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { env } from "./env.js";
import { loggerOptions } from "./lib/logger.js";
import supabaseAuthPlugin from "./plugins/supabase-auth.js";
import healthRoutes from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import categoriasRoutes from "./routes/categorias.js";
import ofertasRoutes from "./routes/ofertas.js";
import favoritosRoutes from "./routes/favoritos.js";
import reportesRoutes from "./routes/reportes.js";
import adminRoutes from "./routes/admin.js";

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: loggerOptions });

  app.register(cors, {
    origin: env.CORS_ORIGINS,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  });

  app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    keyGenerator: (request) => request.user?.id ?? request.ip,
  });

  app.register(supabaseAuthPlugin);
  app.register(healthRoutes);
  app.register(authRoutes);
  app.register(categoriasRoutes);
  app.register(ofertasRoutes);
  app.register(favoritosRoutes);
  app.register(reportesRoutes);
  app.register(adminRoutes);

  return app;
}
