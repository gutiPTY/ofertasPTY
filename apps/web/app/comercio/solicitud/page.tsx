"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { categoriaColor } from "@/components/CategoriaIcon";
import OfertaDetalleModal, { type OfertaDetalleData } from "@/components/OfertaDetalleModal";
import ContactarAdminModal from "@/components/ContactarAdminModal";
import { ESTADO_BADGE } from "@/lib/ofertaEstado";

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
    ruc: string;
    direccion: string;
    direccionFiscal: string;
    representanteLegal: string;
    creadoEn: string;
    categoria: { nombre: string };
  };
  ofertas: OfertaDetalleData[];
}

const ALLOWED_DOC_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_DOC_BYTES = 5 * 1024 * 1024;

const INPUT_CLASS =
  "rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none";

const ESTADO_COMERCIO_LABEL: Record<ComercioMine["comercio"]["estado"], string> = {
  PENDIENTE: "En revisión",
  VERIFICADO: "Verificado",
  RECHAZADO: "Rechazado",
};

const ESTADO_COMERCIO_BADGE: Record<ComercioMine["comercio"]["estado"], string> = {
  PENDIENTE: "bg-warning-bg text-warning",
  VERIFICADO: "bg-success-bg text-success",
  RECHAZADO: "bg-critical-bg text-critical",
};

// Vocabulario propio de esta página (Activa/Vencida) en vez de las
// etiquetas genéricas de lib/ofertaEstado — el usuario lo pidió así
// explícitamente para el contexto de "mis ofertas" de un comercio.
const ESTADO_OFERTA_LABEL: Record<OfertaDetalleData["estado"], string> = {
  PENDIENTE: "Pendiente",
  EN_REVISION: "En revisión",
  PUBLICADA: "Activa",
  RECHAZADA: "Rechazada",
  EXPIRADA: "Vencida",
};

// Pendientes primero, activas segundo, vencidas al final (pedido explícito
// del usuario) — rechazada queda entre medio, antes de vencida.
const ESTADO_OFERTA_ORDEN: Record<OfertaDetalleData["estado"], number> = {
  PENDIENTE: 0,
  EN_REVISION: 1,
  PUBLICADA: 2,
  RECHAZADA: 3,
  EXPIRADA: 4,
};

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
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-2xl bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-ink">
          Términos y Condiciones — Cuenta de Comercio
        </h2>
        <div className="flex flex-col gap-3 text-sm text-ink">
          <p>
            <strong>1. Objeto.</strong> Este formulario solicita la verificación de tu comercio en
            Encuentra Ofertas PTY para publicar ofertas propias, con la opción de contratar
            prioridad en el feed (plan pago).
          </p>
          <p>
            <strong>2. Finalidad exclusiva de los documentos.</strong> El RUC, la dirección fiscal,
            el representante legal y el Aviso de Operaciones que subís se solicitan y almacenan{" "}
            <strong>
              exclusivamente con fines de validación de identidad comercial y seguridad de la
              plataforma
            </strong>{" "}
            (prevención de fraude). No se usan para ningún otro propósito.
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
        <label className="flex items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1 accent-ember"
          />
          He leído y acepto los Términos y Condiciones y la Política de Privacidad.
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-full border border-line px-4 py-2 text-sm font-bold text-ink transition hover:border-ember hover:text-ember"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!checked}
            onClick={onAceptar}
            className="rounded-full bg-ember px-4 py-2 text-sm font-bold text-ember-ink transition hover:brightness-95 disabled:opacity-50"
          >
            Aceptar y enviar solicitud
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="font-display text-2xl font-semibold text-ink">{valor}</p>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}

function DatoRow({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      <span className="text-sm text-ink">{valor}</span>
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
  const [detalle, setDetalle] = useState<OfertaDetalleData | null>(null);
  const [contactando, setContactando] = useState(false);

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

  const ofertasOrdenadas = useMemo(() => {
    if (!mine?.ofertas) return [];
    return [...mine.ofertas].sort((a, b) => ESTADO_OFERTA_ORDEN[a.estado] - ESTADO_OFERTA_ORDEN[b.estado]);
  }, [mine]);

  const stats = useMemo(() => {
    const ofertas = mine?.ofertas ?? [];
    return {
      total: ofertas.length,
      activas: ofertas.filter((o) => o.estado === "PUBLICADA").length,
      pendientes: ofertas.filter((o) => o.estado === "PENDIENTE" || o.estado === "EN_REVISION").length,
      vencidas: ofertas.filter((o) => o.estado === "EXPIRADA").length,
    };
  }, [mine]);

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
    return <main className="p-12 text-center text-muted">Cargando…</main>;
  }

  if (mine) {
    const { comercio } = mine;
    const { bg, fg } = categoriaColor(comercio.categoria.nombre);
    const miembroDesde = new Date(comercio.creadoEn).toLocaleDateString("es-PA", {
      month: "long",
      year: "numeric",
    });

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display text-xl font-bold"
              style={{ backgroundColor: bg, color: fg }}
            >
              {comercio.nombre.charAt(0).toUpperCase()}
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink">{comercio.nombre}</h1>
              <p className="text-sm text-muted">
                {comercio.categoria.nombre} · Miembro desde {miembroDesde}
              </p>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${ESTADO_COMERCIO_BADGE[comercio.estado]}`}
          >
            {ESTADO_COMERCIO_LABEL[comercio.estado]}
          </span>
        </div>

        {comercio.estado === "RECHAZADO" && (
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
            {comercio.motivoRechazo && (
              <div className="rounded-xl bg-critical-bg p-3 text-sm text-critical">
                <span className="font-semibold">Motivo del rechazo: </span>
                {comercio.motivoRechazo}
              </div>
            )}
            <button
              type="button"
              onClick={() => setMine(null)}
              className="self-start rounded-full bg-ember px-4 py-2 text-sm font-bold text-ember-ink transition hover:brightness-95"
            >
              Volver a enviar solicitud
            </button>
          </div>
        )}

        {comercio.estado === "PENDIENTE" && (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center">
            <p className="text-sm text-muted">
              Tu solicitud está en revisión. Un administrador la va a verificar pronto — te
              avisamos por email apenas tengamos una decisión.
            </p>
          </div>
        )}

        {comercio.estado === "VERIFICADO" && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Total" valor={stats.total} />
              <StatCard label="Activas" valor={stats.activas} />
              <StatCard label="Pendientes" valor={stats.pendientes} />
              <StatCard label="Vencidas" valor={stats.vencidas} />
            </div>

            <section className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="mb-3 font-display text-lg font-semibold text-ink">Mis ofertas</h2>
              {ofertasOrdenadas.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <p className="text-sm text-muted">Todavía no publicaste ofertas.</p>
                  <a
                    href="/publicar"
                    className="rounded-full bg-ember px-4 py-2 text-sm font-bold text-ember-ink transition hover:brightness-95"
                  >
                    Publicar mi primera oferta
                  </a>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {ofertasOrdenadas.map((oferta) => (
                    <button
                      key={oferta.id}
                      type="button"
                      onClick={() => setDetalle(oferta)}
                      className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-surface-2"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                        <Image
                          src={oferta.imagenUrl}
                          alt={oferta.titulo}
                          fill
                          sizes="56px"
                          className="object-cover object-top"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-sm font-semibold text-ink">
                          {oferta.titulo}
                        </p>
                        {oferta.precioOferta && (
                          <p className="text-xs font-semibold text-ember">${oferta.precioOferta}</p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${ESTADO_BADGE[oferta.estado]}`}
                      >
                        {ESTADO_OFERTA_LABEL[oferta.estado]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="mb-3 font-display text-lg font-semibold text-ink">Datos del comercio</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DatoRow label="RUC" valor={comercio.ruc} />
                <DatoRow label="Dirección" valor={comercio.direccion} />
                <DatoRow label="Dirección fiscal" valor={comercio.direccionFiscal} />
                <DatoRow label="Representante legal" valor={comercio.representanteLegal} />
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="mb-1 font-display text-lg font-semibold text-ink">Plan pago</h2>
              <p className="text-sm text-muted">
                {comercio.planPago
                  ? "Tenés el plan pago activo: tus ofertas aparecen destacadas con prioridad en el feed."
                  : "Con el plan pago tus ofertas aparecen destacadas con prioridad en el feed. Se gestiona directo con el equipo, fuera de la plataforma."}
              </p>
              <p className="mt-1 text-sm">
                Estado:{" "}
                <strong className={comercio.planPago ? "text-success" : "text-muted"}>
                  {comercio.planPago ? "Activo" : "No activo"}
                </strong>
              </p>
              <button
                type="button"
                onClick={() => setContactando(true)}
                className="mt-4 rounded-full border border-line px-4 py-2 text-sm font-bold text-ink transition hover:border-ember hover:text-ember"
              >
                Contactar al admin
              </button>
            </section>
          </>
        )}

        {detalle && <OfertaDetalleModal oferta={detalle} onClose={() => setDetalle(null)} />}
        {contactando && session && (
          <ContactarAdminModal remitente={session.user.email ?? ""} onClose={() => setContactando(false)} />
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Convertite en comercio verificado</h1>
      <p className="text-sm text-muted">
        Completá estos datos para que un administrador verifique tu comercio. Vas a poder publicar
        ofertas propias y, si activás el plan pago, aparecen destacadas con prioridad.
      </p>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <input name="nombre" placeholder="Nombre del comercio" className={INPUT_CLASS} required />
        <select name="categoriaId" className={INPUT_CLASS} required defaultValue="">
          <option value="" disabled>
            Categoría
          </option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <input name="direccion" placeholder="Dirección del comercio" className={INPUT_CLASS} required />
        <input name="ruc" placeholder="RUC" className={INPUT_CLASS} required />
        <input name="direccionFiscal" placeholder="Dirección fiscal" className={INPUT_CLASS} required />
        <input
          name="representanteLegal"
          placeholder="Representante legal"
          className={INPUT_CLASS}
          required
        />
        <label className="text-sm text-muted">
          Aviso de Operaciones (imagen o PDF)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleDocChange}
            className="mt-1 w-full text-sm"
            required
          />
        </label>
        {error && <p className="text-sm text-critical">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-ember px-4 py-2.5 text-sm font-bold text-ember-ink transition hover:brightness-95 disabled:opacity-50"
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
