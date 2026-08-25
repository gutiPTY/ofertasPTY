"use client";

import { createClient } from "@/lib/supabase/client";

export default function GoogleAuthButton() {
  const supabase = createClient();

  async function handleClick() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded border px-3 py-2 text-sm"
    >
      Continuar con Google
    </button>
  );
}
