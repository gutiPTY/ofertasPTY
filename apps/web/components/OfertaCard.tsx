import Image from "next/image";
import Link from "next/link";
import { categoriaColor } from "./CategoriaIcon";

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
  const { fg } = categoriaColor(categoria.nombre);

  return (
    <Link
      href={`/ofertas/${slug}`}
      className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
        <Image
          src={imagenUrl}
          alt={titulo}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
          className="object-contain"
        />
        <span
          className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
          style={{ backgroundColor: fg }}
        >
          {categoria.nombre}
        </span>
      </div>
      <div className="flex flex-col gap-1 p-3">
        <span className="text-xs font-medium text-muted">{provincia}</span>
        <span className="font-display text-sm font-semibold leading-snug text-ink">{titulo}</span>
        {precioOferta && (
          <span className="font-display text-base font-semibold text-ember">
            ${precioOferta}
            {precioOriginal && (
              <span className="ml-2 font-sans text-xs font-normal text-muted line-through">
                ${precioOriginal}
              </span>
            )}
          </span>
        )}
      </div>
    </Link>
  );
}
