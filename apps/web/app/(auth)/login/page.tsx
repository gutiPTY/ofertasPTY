"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoginInputSchema } from "@ofertaspty/shared-types";
import { createClient } from "@/lib/supabase/client";
import GoogleAuthButton from "@/components/GoogleAuthButton";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = LoginInputSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }

    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword(parsed.data);

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    // Cubre el caso de usuarios que se registraron con confirmación de
    // email requerida: en /registro no había sesión todavía, así que
    // nunca se sincronizaron con la tabla Usuario. /auth/sync es
    // idempotente (upsert), así que llamarlo en cada login es seguro.
    if (data.session && data.user) {
      const nombre =
        (data.user.user_metadata?.nombre as string | undefined) ??
        (data.user.user_metadata?.full_name as string | undefined) ??
        (data.user.user_metadata?.name as string | undefined) ??
        data.user.email ??
        "Usuario";

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ email: data.user.email, nombre }),
      });
    }

    setLoading(false);
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-xl font-semibold">Iniciar sesión</h1>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          className="rounded border px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          className="rounded border px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <div className="h-px flex-1 bg-neutral-200" />o<div className="h-px flex-1 bg-neutral-200" />
      </div>
      <GoogleAuthButton />
    </main>
  );
}
