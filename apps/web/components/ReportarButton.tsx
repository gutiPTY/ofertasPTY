"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ReportarButton({ ofertaId }: { ofertaId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [estado, setEstado] = useState<"idle" | "loading" | "enviado" | "error">("idle");

  async function enviar() {
    if (motivo.trim().length < 3) return;
    setEstado("loading");

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ofertas/${ofertaId}/reportar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ motivo }),
    });

    if (res.ok || res.status === 409) {
      setEstado("enviado");
    } else {
      setEstado("error");
    }
  }

  if (estado === "enviado") {
    return <p className="text-sm text-muted">Gracias, tu reporte fue registrado.</p>;
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="w-fit text-sm font-semibold text-muted underline-offset-2 transition hover:text-critical hover:underline"
      >
        Reportar oferta
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
      <label className="text-sm font-semibold text-ink" htmlFor="motivo-reporte">
        ¿Por qué reportás esta oferta?
      </label>
      <input
        id="motivo-reporte"
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Ej. la oferta ya venció"
        className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={enviar}
          disabled={estado === "loading" || motivo.trim().length < 3}
          className="rounded-full border border-critical bg-critical-bg px-4 py-1.5 text-sm font-bold text-critical transition hover:brightness-95 disabled:opacity-50"
        >
          Enviar reporte
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="rounded-full border border-line px-4 py-1.5 text-sm font-bold text-ink transition hover:border-ember hover:text-ember"
        >
          Cancelar
        </button>
      </div>
      {estado === "error" && (
        <p className="text-sm text-critical">No se pudo enviar el reporte. Intenta de nuevo.</p>
      )}
    </div>
  );
}
