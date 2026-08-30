"use client";

import { useState } from "react";
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
  const [abierto, setAbierto] = useState(false);

  const categoriaActiva = searchParams.get("categoriaId") ?? "";
  const provinciaActiva = searchParams.get("provincia") ?? "";
  const precioMinActivo = searchParams.get("precioMin") ?? "";
  const precioMaxActivo = searchParams.get("precioMax") ?? "";

  const hayFiltrosActivos = Boolean(
    categoriaActiva || provinciaActiva || precioMinActivo || precioMaxActivo,
  );

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
    <aside className="flex flex-col gap-6 md:w-full">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center justify-between text-left font-display text-lg font-semibold text-ink md:pointer-events-none"
      >
        <span>
          Filtros
          {hayFiltrosActivos && (
            <span className="ml-2 rounded-full bg-ember px-2 py-0.5 text-xs font-bold text-ember-ink">
              activos
            </span>
          )}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 transition-transform md:hidden ${abierto ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div className={`${abierto ? "flex" : "hidden"} flex-col gap-6 md:flex`}>
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
              const isActive =
                precioMinActivo === (preset.min ?? "") && precioMaxActivo === (preset.max ?? "");
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
      </div>
    </aside>
  );
}
