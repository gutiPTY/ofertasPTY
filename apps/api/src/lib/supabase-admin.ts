import { createClient } from "@supabase/supabase-js";
import { env } from "../env.js";

// Cliente con service role: ignora RLS. Se usa solo server-side para
// promover roles (app_metadata) y generar URLs firmadas de Storage privado.
// Nunca exponer SUPABASE_SERVICE_ROLE_KEY al cliente.
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
