import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OfertaCard from "@/components/OfertaCard";

interface FavoritoConOferta {
  id: string;
  oferta: {
    id: string;
    slug: string;
    titulo: string;
    imagenUrl: string;
    provincia: string;
    precioOferta: string | null;
    precioOriginal: string | null;
    categoria: { nombre: string };
  };
}

export default async function FavoritosPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/favoritos/mine`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
  });
  const { favoritos } = (await res.json()) as { favoritos: FavoritoConOferta[] };

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Mis favoritos</h1>
      {favoritos.length === 0 && (
        <p className="text-neutral-600">Todavía no guardaste ninguna oferta como favorita.</p>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {favoritos.map((f) => (
          <OfertaCard key={f.id} {...f.oferta} />
        ))}
      </div>
    </main>
  );
}
