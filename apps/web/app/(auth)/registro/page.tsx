"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RegisterInputSchema } from "@ofertaspty/shared-types";
import { createClient } from "@/lib/supabase/client";
import GoogleAuthButton from "@/components/GoogleAuthButton";

const INPUT_CLASS =
  "rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none";

export default function RegistroPage() {
  const router = useRouter();
  const supabase = createClient();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = RegisterInputSchema.safeParse({ email, password, nombre });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { nombre: parsed.data.nombre } },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    const session = data.session;
    if (session) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email: parsed.data.email, nombre: parsed.data.nombre }),
      });
    }

    setLoading(false);
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-sm flex-col justify-center gap-6 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Creá tu cuenta</h1>
        <p className="text-sm text-muted">Publicá ofertas y guardá tus favoritas en segundos.</p>
      </div>

      <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 sm:p-7">
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nombre"
            className={INPUT_CLASS}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
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
            minLength={8}
          />
          {error && <p className="text-sm text-critical">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-ember px-4 py-2.5 text-sm font-bold text-ember-ink transition hover:brightness-95 disabled:opacity-50"
          >
            {loading ? "Creando cuenta…" : "Crear cuenta"}
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
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-semibold text-ember hover:brightness-95">
          Ingresá acá
        </Link>
      </p>
    </main>
  );
}
