"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Slide {
  slug: string;
  titulo: string;
  imagenUrl: string;
  categoria: { nombre: string };
  provincia: string;
}

export default function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [active, setActive] = useState(0);

  if (slides.length === 0) return null;

  return (
    <div className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {slides.map((slide, index) => (
          <Link
            key={slide.slug}
            href={`/ofertas/${slide.slug}`}
            onMouseEnter={() => setActive(index)}
            className="group relative flex h-64 flex-col justify-end overflow-hidden rounded-2xl p-5 text-white"
          >
            <Image
              src={slide.imagenUrl}
              alt={slide.titulo}
              fill
              sizes="(max-width: 640px) 100vw, 33vw"
              className="object-cover transition duration-300 group-hover:scale-105"
              priority={index === 0}
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
