import { REPUTACION_INSIGNIA_UMBRAL } from "@ofertaspty/shared-types";
import { createClient } from "@/lib/supabase/server";
import InsigniaColaboradorConfiable from "@/components/InsigniaColaboradorConfiable";
import EditarOfertaForm from "./EditarOfertaForm";
import {
  aprobarOferta,
  rechazarOferta,
  editarOferta,
  suspenderUsuario,
  verificarComercio,
  rechazarComercio,
  togglePlanPago,
} from "./actions";

interface Categoria {
  id: string;
  nombre: string;
}

interface OfertaPendiente {
  id: string;
  titulo: string;
  descripcion: string;
  imagenUrl: string;
  precioOriginal: string | null;
  precioOferta: string | null;
  provincia: string;
  distrito: string | null;
  direccion: string | null;
  linkExterno: string | null;
  fechaInicio: string;
  fechaVencimiento: string;
  categoriaId: string;
  categoria: { nombre: string };
  creadoPor: { id: string; nombre: string; email: string; suspendido: boolean; reputacion: number };
}

interface OfertaEnRevision extends OfertaPendiente {
  reportes: { motivo: string }[];
}

interface ComercioSolicitud {
  id: string;
  nombre: string;
  direccion: string;
  ruc: string;
  direccionFiscal: string;
  representanteLegal: string;
  categoria: { nombre: string };
  usuario: { nombre: string; email: string };
}

interface ComercioVerificado extends ComercioSolicitud {
  planPago: boolean;
}

function ComercioSolicitudCard({ comercio }: { comercio: ComercioSolicitud }) {
  return (
    <li className="flex flex-col gap-2 rounded border p-3">
      <p className="font-medium">{comercio.nombre}</p>
      <p className="text-sm text-neutral-600">
        {comercio.categoria.nombre} · RUC {comercio.ruc}
      </p>
      <p className="text-xs text-neutral-500">
        Dirección: {comercio.direccion} · Fiscal: {comercio.direccionFiscal}
      </p>
      <p className="text-xs text-neutral-500">Representante legal: {comercio.representanteLegal}</p>
      <p className="text-xs text-neutral-500">
        Solicitado por {comercio.usuario.nombre} ({comercio.usuario.email})
      </p>
      <a
        href={`/api/admin/comercios/${comercio.id}/documento`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-fit text-sm text-blue-700 underline"
      >
        Ver Aviso de Operaciones
      </a>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <form action={verificarComercio.bind(null, comercio.id)}>
          <button type="submit" className="rounded bg-black px-3 py-1.5 text-sm text-white">
            Verificar
          </button>
        </form>
        <form action={rechazarComercio.bind(null, comercio.id)} className="flex gap-2">
          <input
            name="motivo"
            placeholder="Motivo del rechazo"
            required
            className="rounded border px-2 py-1.5 text-sm"
          />
          <button type="submit" className="rounded border px-3 py-1.5 text-sm">
            Rechazar
          </button>
        </form>
      </div>
    </li>
  );
}

function ComercioVerificadoCard({ comercio }: { comercio: ComercioVerificado }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded border p-3">
      <div>
        <p className="font-medium">{comercio.nombre}</p>
        <p className="text-sm text-neutral-600">{comercio.categoria.nombre}</p>
      </div>
      <form action={togglePlanPago.bind(null, comercio.id)}>
        <button
          type="submit"
          className={`rounded px-3 py-1.5 text-sm ${
            comercio.planPago ? "bg-black text-white" : "border"
          }`}
        >
          Plan pago: {comercio.planPago ? "Activo" : "Inactivo"}
        </button>
      </form>
    </li>
  );
}

function OfertaCard({
  oferta,
  reportes,
  categorias,
}: {
  oferta: OfertaPendiente;
  reportes?: { motivo: string }[];
  categorias: Categoria[];
}) {
  return (
    <li className="flex gap-4 rounded border p-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- URL externa (Supabase Storage), panel interno de bajo tráfico */}
      <img src={oferta.imagenUrl} alt={oferta.titulo} className="h-24 w-24 rounded object-cover" />
      <div className="flex flex-1 flex-col gap-1">
        <p className="font-medium">{oferta.titulo}</p>
        <p className="text-sm text-neutral-600">{oferta.descripcion}</p>
        <p className="text-xs text-neutral-500">
          {oferta.categoria.nombre} · {oferta.provincia} · vence{" "}
          {new Date(oferta.fechaVencimiento).toLocaleDateString("es-PA")}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-neutral-500">
          Publicado por {oferta.creadoPor.nombre} ({oferta.creadoPor.email})
          {oferta.creadoPor.reputacion >= REPUTACION_INSIGNIA_UMBRAL && (
            <InsigniaColaboradorConfiable />
          )}
        </p>
        {reportes && reportes.length > 0 && (
          <p className="text-xs text-red-600">
            {reportes.length} reporte{reportes.length === 1 ? "" : "s"}:{" "}
            {reportes.map((r) => r.motivo).join(" · ")}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <form action={aprobarOferta.bind(null, oferta.id)}>
            <button type="submit" className="rounded bg-black px-3 py-1.5 text-sm text-white">
              Aprobar
            </button>
          </form>
          <form action={rechazarOferta.bind(null, oferta.id)} className="flex gap-2">
            <input
              name="motivo"
              placeholder="Motivo (opcional)"
              className="rounded border px-2 py-1.5 text-sm"
            />
            <button type="submit" className="rounded border px-3 py-1.5 text-sm">
              Rechazar
            </button>
          </form>
          <form action={suspenderUsuario.bind(null, oferta.creadoPor.id)}>
            <button type="submit" className="rounded border px-3 py-1.5 text-sm text-red-600">
              {oferta.creadoPor.suspendido ? "Reactivar autor" : "Suspender autor"}
            </button>
          </form>
          <EditarOfertaForm
            oferta={oferta}
            categorias={categorias}
            action={editarOferta.bind(null, oferta.id)}
          />
        </div>
      </div>
    </li>
  );
}

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const [pendientesRes, enRevisionRes, comerciosPendientesRes, comerciosVerificadosRes, categoriasRes] =
    await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/ofertas/pendientes`, {
        headers: { Authorization: `Bearer ${session!.access_token}` },
        cache: "no-store",
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/ofertas/en-revision`, {
        headers: { Authorization: `Bearer ${session!.access_token}` },
        cache: "no-store",
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/comercios/pendientes`, {
        headers: { Authorization: `Bearer ${session!.access_token}` },
        cache: "no-store",
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/comercios/verificados`, {
        headers: { Authorization: `Bearer ${session!.access_token}` },
        cache: "no-store",
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/categorias`, { cache: "no-store" }),
    ]);
  const { ofertas } = (await pendientesRes.json()) as { ofertas: OfertaPendiente[] };
  const { categorias } = (await categoriasRes.json()) as { categorias: Categoria[] };
  const { ofertas: ofertasEnRevision } = (await enRevisionRes.json()) as {
    ofertas: OfertaEnRevision[];
  };
  const { comercios: comerciosPendientes } = (await comerciosPendientesRes.json()) as {
    comercios: ComercioSolicitud[];
  };
  const { comercios: comerciosVerificados } = (await comerciosVerificadosRes.json()) as {
    comercios: ComercioVerificado[];
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 p-6">
      <section className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Cola de moderación ({ofertas.length})</h1>
        {ofertas.length === 0 && <p className="text-neutral-600">No hay ofertas pendientes.</p>}
        <ul className="flex flex-col gap-4">
          {ofertas.map((oferta) => (
            <OfertaCard key={oferta.id} oferta={oferta} categorias={categorias} />
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold">
          Ofertas reportadas en revisión ({ofertasEnRevision.length})
        </h1>
        {ofertasEnRevision.length === 0 && (
          <p className="text-neutral-600">No hay ofertas en revisión.</p>
        )}
        <ul className="flex flex-col gap-4">
          {ofertasEnRevision.map((oferta) => (
            <OfertaCard
              key={oferta.id}
              oferta={oferta}
              reportes={oferta.reportes}
              categorias={categorias}
            />
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold">
          Solicitudes de comercio pendientes ({comerciosPendientes.length})
        </h1>
        {comerciosPendientes.length === 0 && (
          <p className="text-neutral-600">No hay solicitudes pendientes.</p>
        )}
        <ul className="flex flex-col gap-4">
          {comerciosPendientes.map((comercio) => (
            <ComercioSolicitudCard key={comercio.id} comercio={comercio} />
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Comercios verificados ({comerciosVerificados.length})</h1>
        {comerciosVerificados.length === 0 && (
          <p className="text-neutral-600">No hay comercios verificados todavía.</p>
        )}
        <ul className="flex flex-col gap-3">
          {comerciosVerificados.map((comercio) => (
            <ComercioVerificadoCard key={comercio.id} comercio={comercio} />
          ))}
        </ul>
      </section>
    </main>
  );
}
