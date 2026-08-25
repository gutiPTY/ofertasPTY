"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function FavoritoButton({ ofertaId }: { ofertaId: string }) {
  const router = useRouter();
  const supabase = createClient();
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
      setFavorito((await res.json()).favorito);
    }
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
    >
      {favorito ? "★ Guardado en favoritos" : "☆ Guardar en favoritos"}
    </button>
  );
}
