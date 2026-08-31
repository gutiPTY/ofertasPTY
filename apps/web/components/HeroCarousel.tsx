"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Slide {
  slug: string;
  titulo: string;
  imagenUrl: string;
  categoria: { nombre: string };
  provincia: string;
}

function SlideCard({ slide, priority }: { slide: Slide; priority: boolean }) {
  return (
    <Link
      href={`/ofertas/${slide.slug}`}
      className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl bg-surface-2 p-5 text-white"
    >
      <Image
        src={slide.imagenUrl}
        alt={slide.titulo}
        fill
        sizes="(max-width: 640px) 100vw, 33vw"
        className="object-cover object-top transition duration-300 group-hover:scale-105"
        priority={priority}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
      <span className="relative mb-auto w-fit rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-ink">
        {slide.categoria.nombre}
      </span>
      <h3 className="relative font-display text-lg font-semibold leading-tight text-balance">
        {slide.titulo}
      </h3>
      <span className="relative text-sm opacity-90">{slide.provincia}</span>
    </Link>
  );
}

export default function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [active, setActive] = useState(0);

  // En mobile solo se muestra una oferta a la vez, así que rota sola;
  // en desktop las 3 se ven juntas y esto solo mueve el indicador.
  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const slideActual = slides[active] ?? slides[0];
  if (!slideActual) return null;

  return (
    <div className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
      <div className="sm:hidden">
        <SlideCard slide={slideActual} priority />
      </div>

      <div className="hidden gap-4 sm:grid sm:grid-cols-3">
        {slides.map((slide, index) => (
          <div key={slide.slug} onMouseEnter={() => setActive(index)}>
            <SlideCard slide={slide} priority={index === 0} />
          </div>
        ))}
      </div>

      <div className="mt-3 flex justify-center gap-1.5">
        {slides.map((slide, index) => (
          <span
            key={slide.slug}
            className={`h-1.5 rounded-full transition-all ${
              index === active ? "w-4 bg-ember" : "w-1.5 bg-line"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
