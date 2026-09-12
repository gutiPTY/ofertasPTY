"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";

interface ValoracionButtonsProps {
  ofertaId: string;
  buenasIniciales: number;
  malasIniciales: number;
}

export default function ValoracionButtons({
  ofertaId,
  buenasIniciales,
  malasIniciales,
}: ValoracionButtonsProps) {
  const router = useRouter();
  const supabase = createClient();
  const showToast = useToast();
  const [buenas, setBuenas] = useState(buenasIniciales);
  const [malas, setMalas] = useState(malasIniciales);
  const [miVoto, setMiVoto] = useState<boolean | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function votar(esBuena: boolean) {
    if (enviando || miVoto === esBuena) return;
    setEnviando(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ofertas/${ofertaId}/valorar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ esBuena }),
    });

    if (res.ok) {
      const data = await res.json();
      setBuenas(data.buenas);
      setMalas(data.malas);
      setMiVoto(esBuena);
      showToast(esBuena ? "Marcaste esta oferta como buena." : "Marcaste esta oferta como mala.");
    } else if (res.status === 400) {
      showToast("No podés valorar tu propia oferta.");
    }
    setEnviando(false);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => votar(true)}
        disabled={enviando}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition disabled:opacity-50 ${
          miVoto === true
            ? "border-success bg-success-bg text-success"
            : "border-line text-ink hover:border-success hover:text-success"
        }`}
      >
        👍 Buena
        <span className="tabular-nums">{buenas}</span>
      </button>
      <button
        type="button"
        onClick={() => votar(false)}
        disabled={enviando}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition disabled:opacity-50 ${
          miVoto === false
            ? "border-critical bg-critical-bg text-critical"
            : "border-line text-ink hover:border-critical hover:text-critical"
        }`}
      >
        👎 Mala
        <span className="tabular-nums">{malas}</span>
      </button>
    </div>
  );
}
