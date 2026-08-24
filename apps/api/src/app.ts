import Fastify, { type FastifyInstance } from "fastify";
import { loggerOptions } from "./lib/logger";
import supabaseAuthPlugin from "./plugins/supabase-auth";
import healthRoutes from "./routes/health";
import authRoutes from "./routes/auth";

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: loggerOptions });

  app.register(supabaseAuthPlugin);
  app.register(healthRoutes);
  app.register(authRoutes);

  return app;
}
