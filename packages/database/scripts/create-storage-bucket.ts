import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "../src/client";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en packages/database/.env");
  process.exit(1);
}

const BUCKET = "ofertas";

async function main() {
  const admin = createClient(supabaseUrl!, serviceRoleKey!);

  const { data: existing } = await admin.storage.getBucket(BUCKET);
  if (existing) {
    console.log(`El bucket '${BUCKET}' ya existe, no se recrea.`);
  } else {
    const { error } = await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: "5MB",
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
    if (error) {
      console.error("Error creando el bucket:", error.message);
      process.exit(1);
    }
    console.log(`Bucket '${BUCKET}' creado (público, 5MB máx, jpeg/png/webp).`);
  }

  // RLS: cada usuario autenticado solo puede subir dentro de su propia
  // carpeta (<supabaseAuthId>/...). La lectura pública no pasa por RLS
  // porque el bucket es público.
  await prisma.$executeRawUnsafe(
    `DROP POLICY IF EXISTS "ofertas_insert_own_folder" ON storage.objects`,
  );
  await prisma.$executeRawUnsafe(`
    CREATE POLICY "ofertas_insert_own_folder" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = '${BUCKET}' AND (storage.foldername(name))[1] = auth.uid()::text)
  `);
  console.log("Política de Storage RLS aplicada.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
