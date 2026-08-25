import { createClient } from "@supabase/supabase-js";
import { prisma } from "@ofertaspty/database";
import type { Rol as RolType } from "@ofertaspty/shared-types";
import { env } from "../../src/env";

const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const supabaseAnon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

// Se usa un alias +test del email real del proyecto porque Supabase rechaza
// dominios de prueba genéricos (example.com, etc.) en el endpoint público de
// signup; el login sí pasa por ese endpoint aunque la creación sea admin.
function testEmail() {
  return `francisco.goita+test-${Date.now()}-${Math.random().toString(36).slice(2)}@gmail.com`;
}

export async function createTestUser(opts: { role?: RolType } = {}) {
  const email = testEmail();
  const password = "Testing123!";

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: opts.role ? { role: opts.role } : undefined,
  });
  if (createError || !created.user) throw createError ?? new Error("no se pudo crear el usuario de prueba");

  const { data: session, error: loginError } = await supabaseAnon.auth.signInWithPassword({
    email,
    password,
  });
  if (loginError || !session.session) throw loginError ?? new Error("no se pudo loguear el usuario de prueba");

  const supabaseAuthId = created.user.id;

  return {
    accessToken: session.session.access_token,
    supabaseAuthId,
    email,
    async cleanup() {
      const usuario = await prisma.usuario.findUnique({ where: { supabaseAuthId } });
      if (usuario) {
        await prisma.moderacion.deleteMany({
          where: { OR: [{ moderadorId: usuario.id }, { oferta: { creadoPorId: usuario.id } }] },
        });
        await prisma.oferta.deleteMany({ where: { creadoPorId: usuario.id } });
        await prisma.usuario.delete({ where: { id: usuario.id } });
      }
      await supabaseAdmin.auth.admin.deleteUser(supabaseAuthId);
    },
  };
}
