"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PROVINCIAS_PANAMA } from "@ofertaspty/shared-types";

interface Categoria {
  id: string;
  nombre: string;
}

export default function FiltrosFeed({ categorias }: { categorias: Categoria[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function updateParam(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault();
    updateParam("q", q);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="rounded border px-2 py-1.5 text-sm"
        value={searchParams.get("categoriaId") ?? ""}
        onChange={(e) => updateParam("categoriaId", e.target.value)}
      >
        <option value="">Todas las categorías</option>
        {categorias.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>

      <select
        className="rounded border px-2 py-1.5 text-sm"
        value={searchParams.get("provincia") ?? ""}
        onChange={(e) => updateParam("provincia", e.target.value)}
      >
        <option value="">Todas las provincias</option>
        {PROVINCIAS_PANAMA.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar ofertas..."
          className="rounded border px-2 py-1.5 text-sm"
        />
        <button type="submit" className="rounded border px-3 py-1.5 text-sm">
          Buscar
        </button>
      </form>
    </div>
  );
}
