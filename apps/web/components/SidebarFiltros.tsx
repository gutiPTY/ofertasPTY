"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PROVINCIAS_PANAMA } from "@ofertaspty/shared-types";

interface Categoria {
  id: string;
  nombre: string;
}

const PRECIO_PRESETS = [
  { label: "Todos", min: undefined, max: undefined },
  { label: "Menos de $10", min: undefined, max: "10" },
  { label: "$10 – $25", min: "10", max: "25" },
  { label: "$25+", min: "25", max: undefined },
] as const;

export default function SidebarFiltros({ categorias }: { categorias: Categoria[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoriaActiva = searchParams.get("categoriaId") ?? "";
  const provinciaActiva = searchParams.get("provincia") ?? "";
  const precioMinActivo = searchParams.get("precioMin") ?? "";
  const precioMaxActivo = searchParams.get("precioMax") ?? "";

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  return (
    <aside className="flex flex-col gap-6">
      <h3 className="font-display text-lg font-semibold text-ink">Filtros</h3>

      <div className="flex flex-col gap-2 border-b border-line pb-5">
        <h4 className="text-xs font-bold uppercase tracking-wide text-muted">Provincia</h4>
        <button
          type="button"
          onClick={() => updateParams({ provincia: undefined })}
          className={`w-fit text-left text-sm ${provinciaActiva === "" ? "font-bold text-ember" : "text-ink"}`}
        >
          Todas
        </button>
        {PROVINCIAS_PANAMA.map((provincia) => (
          <button
            key={provincia}
            type="button"
            onClick={() => updateParams({ provincia })}
            className={`w-fit text-left text-sm ${provinciaActiva === provincia ? "font-bold text-ember" : "text-ink"}`}
          >
            {provincia}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 border-b border-line pb-5">
        <h4 className="text-xs font-bold uppercase tracking-wide text-muted">Categoría</h4>
        <button
          type="button"
          onClick={() => updateParams({ categoriaId: undefined })}
          className={`w-fit text-left text-sm ${categoriaActiva === "" ? "font-bold text-ember" : "text-ink"}`}
        >
          Todas
        </button>
        {categorias.map((categoria) => (
          <button
            key={categoria.id}
            type="button"
            onClick={() => updateParams({ categoriaId: categoria.id })}
            className={`w-fit text-left text-sm ${categoriaActiva === categoria.id ? "font-bold text-ember" : "text-ink"}`}
          >
            {categoria.nombre}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wide text-muted">Precio</h4>
        <div className="flex flex-wrap gap-2">
          {PRECIO_PRESETS.map((preset) => {
            const isActive = precioMinActivo === (preset.min ?? "") && precioMaxActivo === (preset.max ?? "");
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => updateParams({ precioMin: preset.min, precioMax: preset.max })}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  isActive
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-surface text-ink hover:border-ember"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
