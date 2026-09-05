"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { CrearOfertaInputSchema, DIAS_SEMANA_ORDEN, DIA_SEMANA_LABEL, PROVINCIAS_PANAMA } from "@ofertaspty/shared-types";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";

interface Categoria {
  id: string;
  nombre: string;
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const INPUT_CLASS =
  "rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none";
const LABEL_CLASS = "flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted";

export default function PublicarPage() {
  const router = useRouter();
  const supabase = createClient();
  const showToast = useToast();

  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (imagenPreview) URL.revokeObjectURL(imagenPreview);
    };
  }, [imagenPreview]);

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
    setImagenPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
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
        diaSemana: formData.get("diaSemana") || undefined,
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

      showToast("Oferta enviada — queda pendiente de revisión.");
      router.push("/mis-ofertas");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  if (session === undefined) {
    return <main className="p-12 text-center text-muted">Cargando…</main>;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold text-ink">Publicar oferta</h1>
        <p className="text-sm text-muted">
          Completá los datos de la promoción. Antes de publicarse en el feed, un administrador la
          revisa.
        </p>
      </div>

      <form
        className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 sm:p-7"
        onSubmit={handleSubmit}
      >
        <label className={LABEL_CLASS}>
          Título
          <input name="titulo" placeholder="Ej. 2x1 en combos todos los miércoles" className={INPUT_CLASS} required />
        </label>

        <label className={LABEL_CLASS}>
          Descripción
          <textarea
            name="descripcion"
            placeholder="Contá de qué se trata la promoción, condiciones, etc."
            className={`${INPUT_CLASS} resize-none`}
            rows={4}
            required
          />
        </label>

        <label className={LABEL_CLASS}>
          Imagen de la oferta
          <div className="flex items-center gap-4">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-surface-2">
              {imagenPreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- preview local (object URL), no pasa por Image de Next
                <img src={imagenPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-muted">
                  <path
                    d="M4 17V7a2 2 0 0 1 2-2h3l1.5-2h3L15 5h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImagenChange}
                required
                className="text-sm normal-case text-ink file:mr-3 file:rounded-full file:border-0 file:bg-ember file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-ember-ink hover:file:brightness-95"
              />
              <span className="normal-case text-muted">JPEG, PNG o WebP, hasta 5MB.</span>
            </div>
          </div>
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className={LABEL_CLASS}>
            Precio original (opcional)
            <input name="precioOriginal" type="number" step="0.01" placeholder="0.00" className={INPUT_CLASS} />
          </label>
          <label className={LABEL_CLASS}>
            Precio oferta (opcional)
            <input name="precioOferta" type="number" step="0.01" placeholder="0.00" className={INPUT_CLASS} />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className={LABEL_CLASS}>
            Provincia
            <select name="provincia" className={INPUT_CLASS} required defaultValue="">
              <option value="" disabled>
                Elegí una provincia
              </option>
              {PROVINCIAS_PANAMA.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className={LABEL_CLASS}>
            Distrito (opcional)
            <input name="distrito" placeholder="Distrito" className={INPUT_CLASS} />
          </label>
        </div>

        <label className={LABEL_CLASS}>
          Dirección (opcional)
          <input name="direccion" placeholder="Sucursal o dirección física" className={INPUT_CLASS} />
        </label>

        <label className={LABEL_CLASS}>
          Link externo (opcional)
          <input
            name="linkExterno"
            type="url"
            placeholder="https://..."
            className={INPUT_CLASS}
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className={LABEL_CLASS}>
            Vigencia desde
            <input name="fechaInicio" type="date" className={`${INPUT_CLASS} normal-case`} required />
          </label>
          <label className={LABEL_CLASS}>
            Vigencia hasta
            <input name="fechaVencimiento" type="date" className={`${INPUT_CLASS} normal-case`} required />
          </label>
        </div>

        <label className={LABEL_CLASS}>
          Categoría
          <select name="categoriaId" className={INPUT_CLASS} required defaultValue="">
            <option value="" disabled>
              Elegí una categoría
            </option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className={LABEL_CLASS}>
          Día específico de la semana (opcional)
          <select name="diaSemana" className={INPUT_CLASS} defaultValue="">
            <option value="">No aplica</option>
            {DIAS_SEMANA_ORDEN.map((dia) => (
              <option key={dia} value={dia}>
                {DIA_SEMANA_LABEL[dia]}
              </option>
            ))}
          </select>
          <span className="normal-case text-muted">
            Solo si es una promo recurrente, ej. &quot;Miércoles de Descuento&quot;.
          </span>
        </label>

        {error && <p className="text-sm text-critical">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-ember px-4 py-2.5 text-sm font-bold text-ember-ink transition hover:brightness-95 disabled:opacity-50"
        >
          {loading ? "Publicando…" : "Publicar"}
        </button>
      </form>
    </main>
  );
}
