"use client";

import { useActionState, useEffect, useRef } from "react";
import { PROVINCIAS_PANAMA } from "@ofertaspty/shared-types";
import { useToast } from "@/components/ToastProvider";
import { guardarPreferencias } from "./actions";

interface Categoria {
  id: string;
  nombre: string;
}

interface Preferencias {
  categoriaIds: string[];
  provincias: string[];
}

const CHIP_CLASS =
  "cursor-pointer rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-ink transition peer-checked:border-ember peer-checked:bg-ember peer-checked:text-ember-ink";

export default function PreferenciasForm({
  categorias,
  preferencias,
}: {
  categorias: Categoria[];
  preferencias: Preferencias;
}) {
  const [state, formAction] = useActionState(guardarPreferencias, null);
  const showToast = useToast();
  const montado = useRef(false);

  useEffect(() => {
    if (!montado.current) {
      montado.current = true;
      return;
    }
    if (state === null) return;
    showToast(
      state.ok ? "Preferencias guardadas." : "No se pudieron guardar las preferencias.",
      state.ok ? "success" : "error",
    );
  }, [state, showToast]);

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">
          Categorías favoritas
        </legend>
        <div className="flex flex-wrap gap-x-4 gap-y-3">
          {categorias.map((categoria) => (
            <label key={categoria.id}>
              <input
                type="checkbox"
                name="categoriaIds"
                value={categoria.id}
                defaultChecked={preferencias.categoriaIds.includes(categoria.id)}
                className="peer sr-only"
              />
              <span className={CHIP_CLASS}>{categoria.nombre}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">
          Provincias favoritas
        </legend>
        <div className="flex flex-wrap gap-x-4 gap-y-3">
          {PROVINCIAS_PANAMA.map((provincia) => (
            <label key={provincia}>
              <input
                type="checkbox"
                name="provincias"
                value={provincia}
                defaultChecked={preferencias.provincias.includes(provincia)}
                className="peer sr-only"
              />
              <span className={CHIP_CLASS}>{provincia}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        className="w-fit rounded-full bg-ember px-4 py-2 text-sm font-bold text-ember-ink transition hover:brightness-95"
      >
        Guardar preferencias
      </button>
    </form>
  );
}
