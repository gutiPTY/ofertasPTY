import "dotenv/config";
import { prisma } from "../src/client";

// Supabase expone automáticamente cada tabla del schema "public" vía su API
// REST (PostgREST) usando la anon key — que ya es pública, porque el
// frontend la necesita para Supabase Auth (ver NEXT_PUBLIC_SUPABASE_ANON_KEY).
// Sin RLS, cualquiera con esa key puede leer/editar/borrar cualquier fila de
// cualquier tabla directo por HTTP, sin pasar por apps/api. Esta app nunca
// consulta estas tablas vía el cliente de Supabase (solo Storage y Auth) —
// todo el acceso real es por Prisma en apps/api, que se conecta como el rol
// dueño de las tablas (postgres.<ref>) y por lo tanto NO queda afectado por
// RLS (los dueños de tabla bypasean RLS salvo que se use FORCE ROW LEVEL
// SECURITY, que acá no se usa). Activar RLS sin políticas alcanza para
// cerrar el acceso público sin tocar el comportamiento de la app.
const TABLAS = [
  "Usuario",
  "PreferenciaUsuario",
  "Comercio",
  "Categoria",
  "Oferta",
  "Moderacion",
  "OfertaEdicion",
  "Reporte",
  "Favorito",
  "Notificacion",
  "_prisma_migrations",
];

async function main() {
  for (const tabla of TABLAS) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "public"."${tabla}" ENABLE ROW LEVEL SECURITY;`);
    console.log(`RLS activado en "${tabla}".`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
