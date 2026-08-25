import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  let role: string | null = null;
  if (session) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    }).catch(() => null);
    if (res?.ok) {
      role = (await res.json()).role ?? null;
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Encuentra Ofertas PTY</h1>
      {user ? (
        <>
          <p>
            Sesión iniciada como <strong>{user.email}</strong>
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/publicar" className="rounded bg-black px-3 py-2 text-sm text-white">
              Publicar oferta
            </Link>
            <Link href="/mis-ofertas" className="rounded border px-3 py-2 text-sm">
              Mis ofertas
            </Link>
            {role === "ADMIN" && (
              <Link href="/admin" className="rounded border px-3 py-2 text-sm">
                Panel admin
              </Link>
            )}
          </div>
          <LogoutButton />
        </>
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
