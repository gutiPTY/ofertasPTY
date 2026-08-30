import Link from "next/link";
import CategoriaIcon, { categoriaColor } from "@/components/CategoriaIcon";

interface Categoria {
  id: string;
  nombre: string;
}

export default function CategoriasSection({ categorias }: { categorias: Categoria[] }) {
  return (
    <section className="mx-auto mt-10 max-w-6xl px-4 sm:px-6">
      <h2 className="mb-4 font-display text-xl font-semibold text-ink">Comprá por categoría</h2>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-8">
        {categorias.map((categoria) => {
          const { bg } = categoriaColor(categoria.nombre);
          return (
            <Link
              key={categoria.id}
              href={`/?categoriaId=${categoria.id}`}
              className="group flex flex-col items-center gap-2 text-center"
            >
              <span
                className="flex h-16 w-16 items-center justify-center rounded-2xl transition group-hover:-translate-y-0.5"
                style={{ backgroundColor: bg }}
              >
                <CategoriaIcon nombre={categoria.nombre} className="h-8 w-8" />
              </span>
              <span className="text-xs font-semibold text-ink">{categoria.nombre}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
