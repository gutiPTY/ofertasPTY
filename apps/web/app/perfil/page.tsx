import { redirect } from "next/navigation";
import { PROVINCIAS_PANAMA, REPUTACION_INSIGNIA_UMBRAL } from "@ofertaspty/shared-types";
import { createClient } from "@/lib/supabase/server";
import InsigniaColaboradorConfiable from "@/components/InsigniaColaboradorConfiable";
import { guardarPreferencias } from "./actions";

interface Categoria {
  id: string;
  nombre: string;
}

interface Preferencias {
  categoriaIds: string[];
  provincias: string[];
}

interface Usuario {
  nombre: string;
  email: string;
  reputacion: number;
  creadoEn: string;
}

const CHIP_CLASS =
  "cursor-pointer rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-ink transition peer-checked:border-ember peer-checked:bg-ember peer-checked:text-ember-ink";

export default async function PerfilPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const [categoriasRes, preferenciasRes, meRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/categorias`, { cache: "no-store" }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/preferencias/mine`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    }),
  ]);
  const { categorias } = (await categoriasRes.json()) as { categorias: Categoria[] };
  const preferencias = (await preferenciasRes.json()) as Preferencias;
  // meRes puede ser 404 "usuario_no_sincronizado" si el usuario nunca pasó
  // por /auth/sync (ver login/page.tsx) — se cae a los datos de la sesión
  // de Supabase para no romper la página.
  const usuario: Usuario | null = meRes.ok ? ((await meRes.json()) as { usuario: Usuario }).usuario : null;

  const nombre = usuario?.nombre ?? (session.user.user_metadata?.nombre as string | undefined) ?? "Usuario";
  const email = usuario?.email ?? session.user.email ?? "";
  const reputacion = usuario?.reputacion ?? 0;
  const miembroDesde = usuario?.creadoEn
    ? new Date(usuario.creadoEn).toLocaleDateString("es-PA", { month: "long", year: "numeric" })
    : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-ember font-display text-xl font-bold text-ember-ink">
          {nombre.charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{nombre}</h1>
          <p className="text-sm text-muted">
            {email}
            {miembroDesde ? ` · Miembro desde ${miembroDesde}` : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
        <div>
          <p className="font-display text-lg font-semibold text-ink">{reputacion} pts de reputación</p>
          <p className="text-sm text-muted">
            Sumás puntos cuando tus ofertas se aprueban, restás si se rechazan o las reportan.
          </p>
        </div>
        {reputacion >= REPUTACION_INSIGNIA_UMBRAL && <InsigniaColaboradorConfiable />}
      </div>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Alertas por email</h2>
        <p className="mt-1 text-sm text-muted">
          Elegí tus categorías y provincias favoritas para recibir un resumen semanal por email con las
          ofertas nuevas que coincidan.
        </p>

        <form action={guardarPreferencias} className="mt-4 flex flex-col gap-6">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">
              Categorías favoritas
            </legend>
            <div className="flex flex-wrap gap-x-3 gap-y-2.5">
              {categorias.map((categoria) => (
                <label key={categoria.id}>
                  <input
                    type="checkbox"
                    name="categoriaIds"
                    value={categoria.id}
                    defaultChecked={preferencias.categoriaIds.includes(categoria.id)}
                    className="peer sr-only"
                  />
                  <span className={CHIP_CLASS}>{categoria.nombre}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">
              Provincias favoritas
            </legend>
            <div className="flex flex-wrap gap-x-3 gap-y-2.5">
              {PROVINCIAS_PANAMA.map((provincia) => (
                <label key={provincia}>
                  <input
                    type="checkbox"
                    name="provincias"
                    value={provincia}
                    defaultChecked={preferencias.provincias.includes(provincia)}
                    className="peer sr-only"
                  />
                  <span className={CHIP_CLASS}>{provincia}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            className="w-fit rounded-full bg-ember px-4 py-2 text-sm font-bold text-ember-ink transition hover:brightness-95"
          >
            Guardar preferencias
          </button>
        </form>
      </section>
    </main>
  );
}
