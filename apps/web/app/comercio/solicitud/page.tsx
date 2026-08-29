"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface Categoria {
  id: string;
  nombre: string;
}

interface ComercioMine {
  comercio: {
    id: string;
    nombre: string;
    estado: "PENDIENTE" | "VERIFICADO" | "RECHAZADO";
    motivoRechazo: string | null;
    planPago: boolean;
    categoria: { nombre: string };
  };
  ofertasPorEstado: Record<string, number>;
}

const ALLOWED_DOC_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_DOC_BYTES = 5 * 1024 * 1024;

function TerminosModal({
  onAceptar,
  onCancelar,
}: {
  onAceptar: () => void;
  onCancelar: () => void;
}) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded bg-white p-6">
        <h2 className="text-lg font-semibold">Términos y Condiciones — Cuenta de Comercio</h2>
        <div className="flex flex-col gap-3 text-sm text-neutral-700">
          <p>
            <strong>1. Objeto.</strong> Este formulario solicita la verificación de tu comercio en
            Encuentra Ofertas PTY para publicar ofertas propias, con la opción de contratar
            prioridad en el feed (plan pago).
          </p>
          <p>
            <strong>2. Finalidad exclusiva de los documentos.</strong> El RUC, la dirección fiscal,
            el representante legal y el Aviso de Operaciones que subís se solicitan y almacenan{" "}
            <strong>exclusivamente con fines de validación de identidad comercial y seguridad de la
            plataforma</strong> (prevención de fraude). No se usan para ningún otro propósito.
          </p>
          <p>
            <strong>3. Confidencialidad.</strong> El documento se guarda en un repositorio privado.
            Solo el equipo administrador puede acceder a él para revisar tu solicitud. No se publica
            ni se comparte con terceros, salvo requerimiento legal de autoridad competente.
          </p>
          <p>
            <strong>4. Veracidad de la información.</strong> Declarás que los datos son veraces y
            corresponden a un comercio legalmente constituido en Panamá. Información falsa puede
            resultar en el rechazo de la solicitud o la suspensión de la cuenta.
          </p>
          <p>
            <strong>5. Revisión manual.</strong> La verificación la realiza un administrador; no es
            automática y el tiempo de respuesta puede variar.
          </p>
          <p>
            <strong>6. Plan pago.</strong> La prioridad en el feed (ofertas destacadas) se activa
            manualmente por el administrador mediante un arreglo gestionado fuera de la plataforma.
            Esto no implica ningún cobro automático dentro de la app.
          </p>
          <p>
            <strong>7. Revocación.</strong> La verificación puede revocarse si se detecta uso
            indebido, información falsa o incumplimiento de las políticas de contenido.
          </p>
          <p>
            <strong>8. Retención y eliminación.</strong> Los documentos se conservan mientras la
            cuenta de comercio esté activa. Podés solicitar su eliminación escribiendo a soporte.
          </p>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1"
          />
          He leído y acepto los Términos y Condiciones y la Política de Privacidad.
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancelar} className="rounded border px-3 py-1.5 text-sm">
            Cancelar
          </button>
          <button
            type="button"
            disabled={!checked}
            onClick={onAceptar}
            className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            Aceptar y enviar solicitud
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SolicitudComercioPage() {
  const router = useRouter();
  const supabase = createClient();

  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mine, setMine] = useState<ComercioMine | null | undefined>(undefined);
  const [pendingForm, setPendingForm] = useState<HTMLFormElement | null>(null);

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

  useEffect(() => {
    if (!session) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/comercios/mine`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    })
      .then(async (res) => {
        if (res.status === 404) {
          setMine(null);
          return;
        }
        setMine(await res.json());
      })
      .catch(() => setMine(null));
  }, [session]);

  function handleDocChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_DOC_TYPES.includes(file.type)) {
      setError("El Aviso de Operaciones debe ser JPEG, PNG, WebP o PDF.");
      return;
    }
    if (file.size > MAX_DOC_BYTES) {
      setError("El archivo no puede superar los 5MB.");
      return;
    }
    setError(null);
    setDocFile(file);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!session || !docFile) {
      setError("Falta adjuntar el Aviso de Operaciones.");
      return;
    }

    // Guardamos el form para enviarlo recién después de que el usuario
    // acepte el modal de Términos y Condiciones.
    setPendingForm(event.currentTarget);
  }

  async function enviarSolicitud(form: HTMLFormElement) {
    if (!session || !docFile) return;
    setPendingForm(null);
    setLoading(true);
    try {
      const path = `${session.user.id}/${Date.now()}-${docFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("comercio-docs")
        .upload(path, docFile, { contentType: docFile.type });
      if (uploadError) throw uploadError;

      const formData = new FormData(form);
      const raw = {
        nombre: formData.get("nombre"),
        categoriaId: formData.get("categoriaId"),
        direccion: formData.get("direccion"),
        ruc: formData.get("ruc"),
        direccionFiscal: formData.get("direccionFiscal"),
        representanteLegal: formData.get("representanteLegal"),
        avisoOperacionesPath: path,
        terminosAceptados: true,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/comercios/solicitud`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(raw),
      });

      if (!res.ok) {
        setError("No se pudo enviar la solicitud. Revisá los datos e intentá de nuevo.");
        return;
      }

      router.refresh();
      setMine(undefined);
      const refreshed = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/comercios/mine`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      setMine(refreshed.ok ? await refreshed.json() : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  if (session === undefined || mine === undefined) {
    return <main className="p-6 text-center">Cargando…</main>;
  }

  if (mine) {
    const { comercio, ofertasPorEstado } = mine;
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold">Mi comercio</h1>
        <div className="flex flex-col gap-2 rounded border p-4">
          <p className="font-medium">{comercio.nombre}</p>
          <p className="text-sm text-neutral-600">{comercio.categoria.nombre}</p>
          <p className="text-sm">
            Estado:{" "}
            <span
              className={
                comercio.estado === "VERIFICADO"
                  ? "text-green-700"
                  : comercio.estado === "RECHAZADO"
                    ? "text-red-700"
                    : "text-yellow-700"
              }
            >
              {comercio.estado}
            </span>
          </p>
          {comercio.estado === "RECHAZADO" && comercio.motivoRechazo && (
            <p className="text-sm text-red-600">Motivo: {comercio.motivoRechazo}</p>
          )}
          {comercio.estado === "VERIFICADO" && (
            <p className="text-sm">
              Plan pago: <strong>{comercio.planPago ? "Activo" : "No activo"}</strong>
            </p>
          )}
        </div>

        {comercio.estado === "VERIFICADO" && (
          <div className="rounded border p-4">
            <p className="mb-2 font-medium">Mis ofertas</p>
            <ul className="text-sm text-neutral-700">
              {Object.entries(ofertasPorEstado).length === 0 && <li>Todavía no publicaste ofertas.</li>}
              {Object.entries(ofertasPorEstado).map(([estado, count]) => (
                <li key={estado}>
                  {estado}: {count}
                </li>
              ))}
            </ul>
          </div>
        )}

        {comercio.estado === "RECHAZADO" && (
          <button
            type="button"
            onClick={() => setMine(null)}
            className="rounded bg-black px-3 py-2 text-sm text-white"
          >
            Volver a enviar solicitud
          </button>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Convertite en comercio verificado</h1>
      <p className="text-sm text-neutral-600">
        Completá estos datos para que un administrador verifique tu comercio. Vas a poder publicar
        ofertas propias y, si activás el plan pago, aparecen destacadas con prioridad.
      </p>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <input name="nombre" placeholder="Nombre del comercio" className="rounded border px-3 py-2" required />
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
        <input name="direccion" placeholder="Dirección del comercio" className="rounded border px-3 py-2" required />
        <input name="ruc" placeholder="RUC" className="rounded border px-3 py-2" required />
        <input
          name="direccionFiscal"
          placeholder="Dirección fiscal"
          className="rounded border px-3 py-2"
          required
        />
        <input
          name="representanteLegal"
          placeholder="Representante legal"
          className="rounded border px-3 py-2"
          required
        />
        <label className="text-sm text-neutral-600">
          Aviso de Operaciones (imagen o PDF)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleDocChange}
            className="mt-1 w-full"
            required
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Enviando…" : "Enviar solicitud"}
        </button>
      </form>
      {pendingForm && (
        <TerminosModal
          onCancelar={() => setPendingForm(null)}
          onAceptar={() => enviarSolicitud(pendingForm)}
        />
      )}
    </main>
  );
}
