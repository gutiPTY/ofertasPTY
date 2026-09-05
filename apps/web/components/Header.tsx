import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Logo from "@/components/Logo";
import LogoutButton from "@/components/LogoutButton";
import NotificacionesBell from "@/components/NotificacionesBell";

export default async function Header() {
  const supabase = await createClient();
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
    <div className="border-b border-line bg-paper">
      <div className="border-b border-line bg-surface-2">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-end gap-4 px-4 py-1.5 text-xs text-muted sm:px-6">
          {user ? (
            <>
              <Link href="/mis-ofertas" className="hover:text-ink">
                Mis ofertas
              </Link>
              <Link href="/favoritos" className="hover:text-ink">
                Favoritos
              </Link>
              <Link href="/comercio/solicitud" className="hover:text-ink">
                Mi comercio
              </Link>
              <Link href="/perfil" className="hover:text-ink">
                Mi perfil
              </Link>
              {role === "ADMIN" && (
                <Link href="/admin" className="hover:text-ink">
                  Panel admin
                </Link>
              )}
              <span>{user.email}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-ink">
                Ingresar
              </Link>
              <Link href="/registro" className="font-semibold hover:text-ink">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-4 sm:px-6">
        <Logo />

        {user && <NotificacionesBell />}

        <Link
          href="/publicar"
          className="ml-auto shrink-0 rounded-full bg-ember px-4 py-2 text-sm font-bold text-ember-ink transition hover:brightness-95"
        >
          Publicar oferta
        </Link>
      </div>
    </div>
  );
}
