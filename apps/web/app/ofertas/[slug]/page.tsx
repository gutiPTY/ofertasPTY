import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DIA_SEMANA_LABEL, type DiaSemana } from "@ofertaspty/shared-types";
import FavoritoButton from "@/components/FavoritoButton";
import ReportarButton from "@/components/ReportarButton";
import AdUnit from "@/components/AdUnit";

interface OfertaDetalle {
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
  diaSemana?: DiaSemana | null;
  categoria: { nombre: string };
  comercio: { nombre: string; logoUrl: string | null } | null;
}

async function getOferta(slug: string): Promise<OfertaDetalle | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ofertas/${slug}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()).oferta;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const oferta = await getOferta(slug);
  if (!oferta) return {};

  const descripcion = oferta.descripcion.slice(0, 160);
  const url = `/ofertas/${slug}`;

  return {
    title: oferta.titulo,
    description: descripcion,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: oferta.titulo,
      description: descripcion,
      url,
      images: [{ url: oferta.imagenUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title: oferta.titulo,
      description: descripcion,
      images: [oferta.imagenUrl],
    },
  };
}

export default async function OfertaDetallePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const oferta = await getOferta(slug);
  if (!oferta) notFound();

  const vigenciaDesde = new Date(oferta.fechaInicio).toLocaleDateString("es-PA", {
    day: "numeric",
    month: "long",
  });
  const vigenciaHasta = new Date(oferta.fechaVencimiento).toLocaleDateString("es-PA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="flex w-fit items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-ink"
      >
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
          <path
            d="M12.5 4.5L6.5 10l6 5.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Volver a ofertas
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-surface-2 lg:sticky lg:top-6">
          <Image
            src={oferta.imagenUrl}
            alt={oferta.titulo}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 512px"
            className="object-contain"
          />
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-ember">
                {oferta.categoria.nombre}
              </span>
              <h1 className="font-display text-2xl font-semibold leading-tight text-ink sm:text-3xl">
                {oferta.titulo}
              </h1>
              {oferta.comercio && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  {oferta.comercio.logoUrl && (
                    <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full bg-surface-2">
                      <Image src={oferta.comercio.logoUrl} alt="" fill sizes="20px" className="object-cover" />
                    </span>
                  )}
                  {oferta.comercio.nombre}
                </div>
              )}
            </div>
            <FavoritoButton ofertaId={oferta.id} />
          </div>

          {oferta.precioOferta && (
            <p className="font-display text-3xl font-semibold text-ember">
              ${oferta.precioOferta}
              {oferta.precioOriginal && (
                <span className="ml-2 font-sans text-base font-normal text-muted line-through">
                  ${oferta.precioOriginal}
                </span>
              )}
            </p>
          )}

          <p className="whitespace-pre-line text-sm leading-relaxed text-ink sm:text-base">
            {oferta.descripcion}
          </p>

          <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-5 text-sm text-muted">
            <p className="text-ink">
              {oferta.provincia}
              {oferta.distrito ? `, ${oferta.distrito}` : ""}
              {oferta.direccion ? ` — ${oferta.direccion}` : ""}
            </p>
            <p>
              Vigente del {vigenciaDesde} al {vigenciaHasta}
            </p>
            {oferta.diaSemana && (
              <p className="font-semibold text-ink">Todos los {DIA_SEMANA_LABEL[oferta.diaSemana]}</p>
            )}
            {oferta.linkExterno && (
              <a
                href={oferta.linkExterno}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit font-semibold text-ember transition hover:brightness-95"
              >
                Ver más en el sitio del comercio →
              </a>
            )}
          </div>

          <ReportarButton ofertaId={oferta.id} />
        </div>
      </div>

      <div className="border-t border-line pt-6">
        <AdUnit slot="3543750020" format="auto" fullWidthResponsive />
      </div>
    </main>
  );
}
