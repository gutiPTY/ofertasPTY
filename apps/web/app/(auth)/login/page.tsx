"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginInputSchema } from "@ofertaspty/shared-types";
import { createClient } from "@/lib/supabase/client";
import GoogleAuthButton from "@/components/GoogleAuthButton";

const INPUT_CLASS =
  "rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none";

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
    <main className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-sm flex-col justify-center gap-6 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Bienvenido de nuevo</h1>
        <p className="text-sm text-muted">Ingresá para ver tus ofertas y favoritos.</p>
      </div>

      <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 sm:p-7">
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            className={INPUT_CLASS}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            className={INPUT_CLASS}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-critical">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-ember px-4 py-2.5 text-sm font-bold text-ember-ink transition hover:brightness-95 disabled:opacity-50"
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-muted">
          <div className="h-px flex-1 bg-line" />
          o
          <div className="h-px flex-1 bg-line" />
        </div>

        <GoogleAuthButton />
      </div>

      <p className="text-center text-sm text-muted">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="font-semibold text-ember hover:brightness-95">
          Creá una acá
        </Link>
      </p>
    </main>
  );
}
