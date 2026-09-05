import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { ZodError } from "zod";
import { env } from "./env.js";
import { loggerOptions } from "./lib/logger.js";
import supabaseAuthPlugin from "./plugins/supabase-auth.js";
import healthRoutes from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import categoriasRoutes from "./routes/categorias.js";
import ofertasRoutes from "./routes/ofertas.js";
import favoritosRoutes from "./routes/favoritos.js";
import notificacionesRoutes from "./routes/notificaciones.js";
import preferenciasRoutes from "./routes/preferencias.js";
import reportesRoutes from "./routes/reportes.js";
import comerciosRoutes from "./routes/comercios.js";
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
  app.register(notificacionesRoutes);
  app.register(preferenciasRoutes);
  app.register(reportesRoutes);
  app.register(comerciosRoutes);
  app.register(adminRoutes);

  // Sin esto, un .parse() de Zod que falla (input inválido del cliente)
  // propagaba como excepción no manejada y Fastify respondía 500 — una
  // respuesta de "error del servidor" para lo que en realidad es un 400
  // de "el cliente mandó datos inválidos". Se deja pasar cualquier otro
  // error al manejador default de Fastify (reply.send(error)).
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: "validacion",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
    return reply.send(error);
  });

  return app;
}
