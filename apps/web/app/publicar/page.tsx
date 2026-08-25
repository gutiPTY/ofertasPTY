"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { CrearOfertaInputSchema, PROVINCIAS_PANAMA } from "@ofertaspty/shared-types";
import { createClient } from "@/lib/supabase/client";

interface Categoria {
  id: string;
  nombre: string;
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function PublicarPage() {
  const router = useRouter();
  const supabase = createClient();

  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setSession(data.session);
    });
  }, [router, supabase]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/categorias`)
      .then((res) => res.json())
      .then((data) => setCategorias(data.categorias ?? []))
      .catch(() => setCategorias([]));
  }, []);

  function handleImagenChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("La imagen debe ser JPEG, PNG o WebP.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("La imagen no puede superar los 5MB.");
      return;
    }
    setError(null);
    setImagenFile(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // React recicla el SyntheticEvent: hay que guardar el form ANTES del
    // primer await, porque event.currentTarget queda null después.
    const form = event.currentTarget;

    if (!session || !imagenFile) {
      setError("Falta seleccionar una imagen.");
      return;
    }

    setLoading(true);
    try {
      const path = `${session.user.id}/${Date.now()}-${imagenFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("ofertas")
        .upload(path, imagenFile, { contentType: imagenFile.type });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("ofertas").getPublicUrl(path);

      const formData = new FormData(form);
      const raw = {
        titulo: formData.get("titulo"),
        descripcion: formData.get("descripcion"),
        imagenUrl: publicUrl,
        precioOriginal: formData.get("precioOriginal") || undefined,
        precioOferta: formData.get("precioOferta") || undefined,
        provincia: formData.get("provincia"),
        distrito: formData.get("distrito") || undefined,
        direccion: formData.get("direccion") || undefined,
        linkExterno: formData.get("linkExterno") || undefined,
        fechaInicio: formData.get("fechaInicio"),
        fechaVencimiento: formData.get("fechaVencimiento"),
        categoriaId: formData.get("categoriaId"),
      };

      const parsed = CrearOfertaInputSchema.safeParse(raw);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Datos inválidos");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ofertas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          body.error === "limite_ofertas_pendientes"
            ? "Ya tenés demasiadas ofertas pendientes de moderación."
            : "No se pudo publicar la oferta.",
        );
        return;
      }

      router.push("/mis-ofertas");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  if (session === undefined) {
    return <main className="p-6 text-center">Cargando…</main>;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Publicar oferta</h1>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <input name="titulo" placeholder="Título" className="rounded border px-3 py-2" required />
        <textarea
          name="descripcion"
          placeholder="Descripción"
          className="rounded border px-3 py-2"
          rows={4}
          required
        />
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImagenChange}
          required
        />
        <div className="flex gap-3">
          <input
            name="precioOriginal"
            type="number"
            step="0.01"
            placeholder="Precio original (opcional)"
            className="w-1/2 rounded border px-3 py-2"
          />
          <input
            name="precioOferta"
            type="number"
            step="0.01"
            placeholder="Precio oferta (opcional)"
            className="w-1/2 rounded border px-3 py-2"
          />
        </div>
        <select name="provincia" className="rounded border px-3 py-2" required defaultValue="">
          <option value="" disabled>
            Provincia
          </option>
          {PROVINCIAS_PANAMA.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <input name="distrito" placeholder="Distrito (opcional)" className="rounded border px-3 py-2" />
        <input name="direccion" placeholder="Dirección (opcional)" className="rounded border px-3 py-2" />
        <input
          name="linkExterno"
          type="url"
          placeholder="Link externo (opcional)"
          className="rounded border px-3 py-2"
        />
        <label className="text-sm text-neutral-600">
          Vigencia desde
          <input name="fechaInicio" type="date" className="mt-1 w-full rounded border px-3 py-2" required />
        </label>
        <label className="text-sm text-neutral-600">
          Vigencia hasta
          <input
            name="fechaVencimiento"
            type="date"
            className="mt-1 w-full rounded border px-3 py-2"
            required
          />
        </label>
        <select name="categoriaId" className="rounded border px-3 py-2" required defaultValue="">
          <option value="" disabled>
            Categoría
          </option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Publicando…" : "Publicar"}
        </button>
      </form>
    </main>
  );
}
