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
    return <p className="text-sm text-neutral-500">Gracias, tu reporte fue registrado.</p>;
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-sm text-neutral-500 underline"
      >
        Reportar oferta
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded border p-3">
      <label className="text-sm font-medium" htmlFor="motivo-reporte">
        ¿Por qué reportas esta oferta?
      </label>
      <input
        id="motivo-reporte"
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Ej. la oferta ya venció"
        className="rounded border px-2 py-1.5 text-sm"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={enviar}
          disabled={estado === "loading" || motivo.trim().length < 3}
          className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          Enviar reporte
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="rounded border px-3 py-1.5 text-sm"
        >
          Cancelar
        </button>
      </div>
      {estado === "error" && (
        <p className="text-sm text-red-600">No se pudo enviar el reporte. Intenta de nuevo.</p>
      )}
    </div>
  );
}
