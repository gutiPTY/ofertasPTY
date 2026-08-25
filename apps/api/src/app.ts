import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { env } from "./env";
import { loggerOptions } from "./lib/logger";
import supabaseAuthPlugin from "./plugins/supabase-auth";
import healthRoutes from "./routes/health";
import authRoutes from "./routes/auth";
import categoriasRoutes from "./routes/categorias";
import ofertasRoutes from "./routes/ofertas";
import adminRoutes from "./routes/admin";

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
  app.register(adminRoutes);

  return app;
}
