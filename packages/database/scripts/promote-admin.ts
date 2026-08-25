import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { Rol } from "@prisma/client";
import { prisma } from "../src/client";

const email = process.argv[2];
if (!email) {
  console.error("Uso: pnpm --filter @ofertaspty/database run promote-admin -- <email>");
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en packages/database/.env");
  process.exit(1);
}

async function main() {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) {
    console.error(`No existe un Usuario con email ${email}. Registrate primero en la app.`);
    process.exit(1);
  }

  const admin = createClient(supabaseUrl!, serviceRoleKey!);
  const { error } = await admin.auth.admin.updateUserById(usuario.supabaseAuthId, {
    app_metadata: { role: Rol.ADMIN },
  });
  if (error) {
    console.error("Error actualizando Supabase Auth:", error.message);
    process.exit(1);
  }

  await prisma.usuario.update({ where: { id: usuario.id }, data: { rol: Rol.ADMIN } });
  console.log(`${email} promovido a ADMIN. Tiene que volver a iniciar sesión para refrescar el JWT.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
