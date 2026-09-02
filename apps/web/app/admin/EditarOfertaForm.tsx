"use client";

import { useState } from "react";
import { PROVINCIAS_PANAMA } from "@ofertaspty/shared-types";

interface Categoria {
  id: string;
  nombre: string;
}

interface OfertaEditable {
  titulo: string;
  descripcion: string;
  imagenUrl: string;
  precioOriginal: string | null;
  precioOferta: string | null;
  provincia: string;
  distrito: string | null;
  direccion: string | null;
  linkExterno: string | null;
  fechaInicio: string;
  fechaVencimiento: string;
  categoriaId: string;
}

function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

// input[type=date] solo tiene precisión de día: si se manda igual que como
// llegó (aunque el admin no lo haya tocado), el backend lo interpretaría
// como "cambiado" porque el valor guardado original tiene hora exacta de
// creación. Se comparan contra el valor base y solo se mandan los campos
// que el admin realmente modificó.
function valorBase(oferta: OfertaEditable, campo: string): string {
  switch (campo) {
    case "fechaInicio":
      return toDateInputValue(oferta.fechaInicio);
    case "fechaVencimiento":
      return toDateInputValue(oferta.fechaVencimiento);
    case "precioOriginal":
      return oferta.precioOriginal ?? "";
    case "precioOferta":
      return oferta.precioOferta ?? "";
    case "distrito":
      return oferta.distrito ?? "";
    case "direccion":
      return oferta.direccion ?? "";
    case "linkExterno":
      return oferta.linkExterno ?? "";
    case "titulo":
      return oferta.titulo;
    case "descripcion":
      return oferta.descripcion;
    case "imagenUrl":
      return oferta.imagenUrl;
    case "provincia":
      return oferta.provincia;
    case "categoriaId":
      return oferta.categoriaId;
    default:
      return "";
  }
}

const CAMPOS_EDITABLES = [
  "titulo",
  "descripcion",
  "imagenUrl",
  "precioOriginal",
  "precioOferta",
  "provincia",
  "distrito",
  "direccion",
  "linkExterno",
  "fechaInicio",
  "fechaVencimiento",
  "categoriaId",
];

export default function EditarOfertaForm({
  oferta,
  categorias,
  action,
}: {
  oferta: OfertaEditable;
  categorias: Categoria[];
  action: (formData: FormData) => void;
}) {
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-full border border-line px-4 py-1.5 text-sm font-bold text-ink transition hover:border-ember hover:text-ember"
      >
        Editar
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        const filtrado = new FormData();
        for (const campo of CAMPOS_EDITABLES) {
          const valor = formData.get(campo);
          if (typeof valor === "string" && valor !== valorBase(oferta, campo)) {
            filtrado.set(campo, valor);
          }
        }
        if ([...filtrado.keys()].length > 0) {
          action(filtrado);
        }
        setAbierto(false);
      }}
      className="mt-2 flex w-full flex-col gap-2 rounded-2xl border border-line bg-surface-2 p-4"
    >
      <input name="titulo" defaultValue={oferta.titulo} className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none" />
      <textarea
        name="descripcion"
        defaultValue={oferta.descripcion}
        rows={3}
        className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none"
      />
      <input
        name="imagenUrl"
        defaultValue={oferta.imagenUrl}
        className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none"
      />
      <div className="flex gap-2">
        <input
          name="precioOriginal"
          type="number"
          step="0.01"
          defaultValue={oferta.precioOriginal ?? ""}
          placeholder="Precio original"
          className="w-1/2 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none"
        />
        <input
          name="precioOferta"
          type="number"
          step="0.01"
          defaultValue={oferta.precioOferta ?? ""}
          placeholder="Precio oferta"
          className="w-1/2 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none"
        />
      </div>
      <select
        name="provincia"
        defaultValue={oferta.provincia}
        className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none"
      >
        {PROVINCIAS_PANAMA.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <input
        name="distrito"
        defaultValue={oferta.distrito ?? ""}
        placeholder="Distrito"
        className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none"
      />
      <input
        name="direccion"
        defaultValue={oferta.direccion ?? ""}
        placeholder="Dirección"
        className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none"
      />
      <input
        name="linkExterno"
        defaultValue={oferta.linkExterno ?? ""}
        placeholder="Link externo"
        className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none"
      />
      <div className="flex gap-2">
        <input
          name="fechaInicio"
          type="date"
          defaultValue={toDateInputValue(oferta.fechaInicio)}
          className="w-1/2 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none"
        />
        <input
          name="fechaVencimiento"
          type="date"
          defaultValue={toDateInputValue(oferta.fechaVencimiento)}
          className="w-1/2 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none"
        />
      </div>
      <select
        name="categoriaId"
        defaultValue={oferta.categoriaId}
        className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none"
      >
        {categorias.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button type="submit" className="rounded-full bg-ember px-4 py-1.5 text-sm font-bold text-ember-ink transition hover:brightness-95">
          Guardar cambios
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="rounded-full border border-line px-4 py-1.5 text-sm font-bold text-ink transition hover:border-ember hover:text-ember"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
