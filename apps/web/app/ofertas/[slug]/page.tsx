import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FavoritoButton from "@/components/FavoritoButton";

interface OfertaDetalle {
  id: string;
  titulo: string;
  descripcion: string;
  imagenUrl: string;
  precioOriginal: string | null;
  precioOferta: string | null;
  provincia: string;
  distrito: string | null;
  direccion: string | null;
  linkExterno: string | null;
  fechaVencimiento: string;
  categoria: { nombre: string };
}

async function getOferta(slug: string): Promise<OfertaDetalle | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ofertas/${slug}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()).oferta;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const oferta = await getOferta(params.slug);
  if (!oferta) return {};
  return {
    title: `${oferta.titulo} — Encuentra Ofertas PTY`,
    description: oferta.descripcion.slice(0, 160),
  };
}

export default async function OfertaDetallePage({ params }: { params: { slug: string } }) {
  const oferta = await getOferta(params.slug);
  if (!oferta) notFound();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      {/* eslint-disable-next-line @next/next/no-img-element -- URL externa (Supabase Storage) */}
      <img src={oferta.imagenUrl} alt={oferta.titulo} className="w-full rounded object-cover" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-sm text-neutral-500">{oferta.categoria.nombre}</span>
          <h1 className="text-2xl font-semibold">{oferta.titulo}</h1>
        </div>
        <FavoritoButton ofertaId={oferta.id} />
      </div>

      {oferta.precioOferta && (
        <p className="text-xl font-semibold">
          ${oferta.precioOferta}
          {oferta.precioOriginal && (
            <span className="ml-2 text-base text-neutral-400 line-through">
              ${oferta.precioOriginal}
            </span>
          )}
        </p>
      )}

      <p className="whitespace-pre-line text-neutral-700">{oferta.descripcion}</p>

      <div className="text-sm text-neutral-500">
        <p>
          {oferta.provincia}
          {oferta.distrito ? `, ${oferta.distrito}` : ""}
          {oferta.direccion ? ` — ${oferta.direccion}` : ""}
        </p>
        <p>Vence el {new Date(oferta.fechaVencimiento).toLocaleDateString("es-PA")}</p>
        {oferta.linkExterno && (
          <a href={oferta.linkExterno} target="_blank" rel="noopener noreferrer" className="underline">
            Ver más
          </a>
        )}
      </div>
    </main>
  );
}
