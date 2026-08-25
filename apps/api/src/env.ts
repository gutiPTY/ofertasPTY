import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  // Todavía no se creó el bucket de Storage (recién hace falta para subir
  // imágenes de ofertas en Fase 1); opcional hasta entonces.
  SUPABASE_STORAGE_BUCKET: z.string().optional(),
  // Lista separada por comas de orígenes permitidos para CORS (web dev +
  // despliegues de Vercel). Sin esto el navegador bloquea los fetch desde
  // apps/web (distinto origen que la API).
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000")
    .transform((value) => value.split(",").map((origin) => origin.trim())),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = schema.parse(process.env);
export type Env = typeof env;
