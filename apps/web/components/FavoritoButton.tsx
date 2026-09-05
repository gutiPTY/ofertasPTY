"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path
        strokeLinejoin="round"
        d="M12 3.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.2-5.4 3.2 1.3-6-4.6-4.1 6.1-.6L12 3.5Z"
      />
    </svg>
  );
}

export default function FavoritoButton({ ofertaId }: { ofertaId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const showToast = useToast();
  const [favorito, setFavorito] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/favoritos/mine`, {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      if (!res.ok) return;
      const { favoritos } = await res.json();
      setFavorito(favoritos.some((f: { ofertaId: string }) => f.ofertaId === ofertaId));
    });
  }, [ofertaId, supabase]);

  async function toggle() {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/favoritos/${ofertaId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      const { favorito: nuevoValor } = await res.json();
      setFavorito(nuevoValor);
      showToast(nuevoValor ? "Guardado en favoritos" : "Quitado de favoritos");
    }
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-bold transition disabled:opacity-50 ${
        favorito
          ? "border-ember bg-ember text-ember-ink hover:brightness-95"
          : "border-line text-ink hover:border-ember hover:text-ember"
      }`}
    >
      <StarIcon filled={favorito} />
      {favorito ? "Guardado" : "Guardar"}
    </button>
  );
}
