import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function Header() {
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
    <header className="border-b">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 p-4">
        <Link href="/" className="text-lg font-semibold">
          Encuentra Ofertas PTY
        </Link>

        {user ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link href="/publicar" className="rounded bg-black px-3 py-1.5 text-white">
              Publicar oferta
            </Link>
            <Link href="/mis-ofertas" className="rounded border px-3 py-1.5">
              Mis ofertas
            </Link>
            <Link href="/favoritos" className="rounded border px-3 py-1.5">
              Favoritos
            </Link>
            <Link href="/comercio/solicitud" className="rounded border px-3 py-1.5">
              Mi comercio
            </Link>
            {role === "ADMIN" && (
              <Link href="/admin" className="rounded border px-3 py-1.5">
                Panel admin
              </Link>
            )}
            <span className="text-neutral-500">{user.email}</span>
            <LogoutButton />
          </div>
        ) : (
          <div className="flex gap-2 text-sm">
            <Link href="/login" className="rounded bg-black px-3 py-1.5 text-white">
              Ingresar
            </Link>
            <Link href="/registro" className="rounded border px-3 py-1.5">
              Crear cuenta
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
