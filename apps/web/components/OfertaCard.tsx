import Image from "next/image";
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
      <div className="relative h-40 w-full">
        <Image
          src={imagenUrl}
          alt={titulo}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
          className="object-cover"
        />
      </div>
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
