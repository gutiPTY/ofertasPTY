import Link from "next/link";

interface OfertaCardProps {
  slug: string;
  titulo: string;
  imagenUrl: string;
  provincia: string;
  precioOferta: string | null;
  precioOriginal: string | null;
  categoria: { nombre: string };
}

export default function OfertaCard({
  slug,
  titulo,
  imagenUrl,
  provincia,
  precioOferta,
  precioOriginal,
  categoria,
}: OfertaCardProps) {
  return (
    <Link href={`/ofertas/${slug}`} className="flex flex-col overflow-hidden rounded border">
      {/* eslint-disable-next-line @next/next/no-img-element -- URL externa (Supabase Storage) */}
      <img src={imagenUrl} alt={titulo} className="h-40 w-full object-cover" />
      <div className="flex flex-col gap-1 p-3">
        <span className="text-xs text-neutral-500">
          {categoria.nombre} · {provincia}
        </span>
        <span className="font-medium">{titulo}</span>
        {precioOferta && (
          <span className="text-sm">
            <strong>${precioOferta}</strong>
            {precioOriginal && (
              <span className="ml-2 text-neutral-400 line-through">${precioOriginal}</span>
            )}
          </span>
        )}
      </div>
    </Link>
  );
}
