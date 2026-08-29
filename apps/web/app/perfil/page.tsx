import { redirect } from "next/navigation";
import { PROVINCIAS_PANAMA } from "@ofertaspty/shared-types";
import { createClient } from "@/lib/supabase/server";
import { guardarPreferencias } from "./actions";

interface Categoria {
  id: string;
  nombre: string;
}

interface Preferencias {
  categoriaIds: string[];
  provincias: string[];
}

export default async function PerfilPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const [categoriasRes, preferenciasRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/categorias`, { cache: "no-store" }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/preferencias/mine`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    }),
  ]);
  const { categorias } = (await categoriasRes.json()) as { categorias: Categoria[] };
  const preferencias = (await preferenciasRes.json()) as Preferencias;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Mi perfil</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Elegí tus categorías y provincias favoritas para recibir un resumen semanal por email
          con las ofertas nuevas que coincidan.
        </p>
      </div>

      <form action={guardarPreferencias} className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-medium">Categorías favoritas</legend>
          <div className="grid grid-cols-2 gap-2">
            {categorias.map((categoria) => (
              <label key={categoria.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="categoriaIds"
                  value={categoria.id}
                  defaultChecked={preferencias.categoriaIds.includes(categoria.id)}
                />
                {categoria.nombre}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-medium">Provincias favoritas</legend>
          <div className="grid grid-cols-2 gap-2">
            {PROVINCIAS_PANAMA.map((provincia) => (
              <label key={provincia} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="provincias"
                  value={provincia}
                  defaultChecked={preferencias.provincias.includes(provincia)}
                />
                {provincia}
              </label>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="w-fit rounded bg-black px-4 py-2 text-sm text-white">
          Guardar preferencias
        </button>
      </form>
    </main>
  );
}
