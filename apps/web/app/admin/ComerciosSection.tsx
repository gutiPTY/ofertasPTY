"use client";

import { useState } from "react";
import EnviarPromocionModal from "@/components/EnviarPromocionModal";

interface ComercioVerificado {
  id: string;
  nombre: string;
  planPago: boolean;
  categoria: { nombre: string };
}

function ComercioRow({
  comercio,
  seleccionado,
  onToggleSeleccion,
  togglePlanPago,
}: {
  comercio: ComercioVerificado;
  seleccionado: boolean;
  onToggleSeleccion: () => void;
  togglePlanPago: (id: string) => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
      <input
        type="checkbox"
        checked={seleccionado}
        onChange={onToggleSeleccion}
        className="h-4 w-4 accent-ember"
        aria-label={`Seleccionar ${comercio.nombre}`}
      />
      <div className="flex-1">
        <p className="font-display text-sm font-semibold text-ink">{comercio.nombre}</p>
        <p className="text-xs text-muted">{comercio.categoria.nombre}</p>
      </div>
      <form action={togglePlanPago.bind(null, comercio.id)}>
        <button
          type="submit"
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
            comercio.planPago
              ? "bg-ember text-ember-ink hover:brightness-95"
              : "border border-line text-ink hover:border-ember hover:text-ember"
          }`}
        >
          Plan pago: {comercio.planPago ? "Activo" : "Inactivo"}
        </button>
      </form>
    </li>
  );
}

export default function ComerciosSection({
  comercios,
  togglePlanPago,
}: {
  comercios: ComercioVerificado[];
  togglePlanPago: (id: string) => void;
}) {
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [enviandoPromo, setEnviandoPromo] = useState(false);

  const conPlanPago = comercios.filter((c) => c.planPago);
  const sinPlanPago = comercios.filter((c) => !c.planPago);

  function toggle(id: string) {
    setSeleccionados((actual) => {
      const nuevo = new Set(actual);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  }

  const destinatarios = comercios.filter((c) => seleccionados.has(c.id));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {seleccionados.size} {seleccionados.size === 1 ? "comercio seleccionado" : "comercios seleccionados"}
        </p>
        <button
          type="button"
          onClick={() => setEnviandoPromo(true)}
          disabled={seleccionados.size === 0}
          className="rounded-full bg-ember px-4 py-2 text-sm font-bold text-ember-ink transition hover:brightness-95 disabled:opacity-40"
        >
          Enviar promoción
        </button>
      </div>

      {comercios.length === 0 && <p className="text-sm text-muted">No hay comercios verificados todavía.</p>}

      {conPlanPago.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
            Con plan pago ({conPlanPago.length})
          </h3>
          <ul className="flex flex-col gap-2">
            {conPlanPago.map((comercio) => (
              <ComercioRow
                key={comercio.id}
                comercio={comercio}
                seleccionado={seleccionados.has(comercio.id)}
                onToggleSeleccion={() => toggle(comercio.id)}
                togglePlanPago={togglePlanPago}
              />
            ))}
          </ul>
        </div>
      )}

      {sinPlanPago.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
            Sin plan pago ({sinPlanPago.length})
          </h3>
          <ul className="flex flex-col gap-2">
            {sinPlanPago.map((comercio) => (
              <ComercioRow
                key={comercio.id}
                comercio={comercio}
                seleccionado={seleccionados.has(comercio.id)}
                onToggleSeleccion={() => toggle(comercio.id)}
                togglePlanPago={togglePlanPago}
              />
            ))}
          </ul>
        </div>
      )}

      {enviandoPromo && (
        <EnviarPromocionModal destinatarios={destinatarios} onClose={() => setEnviandoPromo(false)} />
      )}
    </div>
  );
}
