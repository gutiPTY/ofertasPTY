import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Encuentra Ofertas PTY</h1>
      {user ? (
        <p>
          Sesión iniciada como <strong>{user.email}</strong>
        </p>
      ) : (
        <div className="flex gap-3">
          <Link href="/login" className="rounded bg-black px-3 py-2 text-white">
            Ingresar
          </Link>
          <Link href="/registro" className="rounded border px-3 py-2">
            Crear cuenta
          </Link>
        </div>
      )}
    </main>
  );
}
