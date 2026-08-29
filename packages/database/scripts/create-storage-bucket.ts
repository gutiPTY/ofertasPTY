import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "../src/client";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en packages/database/.env");
  process.exit(1);
}

const admin = createClient(supabaseUrl!, serviceRoleKey!);

interface BucketConfig {
  name: string;
  public: boolean;
  fileSizeLimit: string;
  allowedMimeTypes: string[];
}

const BUCKETS: BucketConfig[] = [
  {
    name: "ofertas",
    public: true,
    fileSizeLimit: "5MB",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  {
    // Épica 5 — documentos de verificación de comercio (RUC, aviso de
    // operaciones). Privado: nunca se sirve por URL pública, solo por
    // URL firmada generada por el backend para el dueño o un admin.
    name: "comercio-docs",
    public: false,
    fileSizeLimit: "5MB",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  },
];

async function ensureBucket(bucket: BucketConfig) {
  const { data: existing } = await admin.storage.getBucket(bucket.name);
  if (existing) {
    console.log(`El bucket '${bucket.name}' ya existe, no se recrea.`);
  } else {
    const { error } = await admin.storage.createBucket(bucket.name, {
      public: bucket.public,
      fileSizeLimit: bucket.fileSizeLimit,
      allowedMimeTypes: bucket.allowedMimeTypes,
    });
    if (error) {
      console.error(`Error creando el bucket '${bucket.name}':`, error.message);
      process.exit(1);
    }
    console.log(
      `Bucket '${bucket.name}' creado (${bucket.public ? "público" : "privado"}, ${bucket.fileSizeLimit} máx, ${bucket.allowedMimeTypes.join("/")}).`,
    );
  }

  // RLS: cada usuario autenticado solo puede subir dentro de su propia
  // carpeta (<supabaseAuthId>/...). Para el bucket privado no hace falta
  // política de lectura: solo el backend (service role, que ignora RLS)
  // genera URLs firmadas.
  const policyName = `${bucket.name.replace(/-/g, "_")}_insert_own_folder`;
  await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "${policyName}" ON storage.objects`);
  await prisma.$executeRawUnsafe(`
    CREATE POLICY "${policyName}" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = '${bucket.name}' AND (storage.foldername(name))[1] = auth.uid()::text)
  `);
  console.log(`Política de Storage RLS aplicada para '${bucket.name}'.`);
}

async function main() {
  for (const bucket of BUCKETS) {
    await ensureBucket(bucket);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
