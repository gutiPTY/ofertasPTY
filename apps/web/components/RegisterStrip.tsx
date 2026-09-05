import Link from "next/link";
import { FlameIcon } from "@/components/Logo";

export default function RegisterStrip() {
  return (
    <div className="mt-8 bg-gradient-to-r from-ember to-flare text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <FlameIcon className="h-8 w-8 shrink-0 brightness-0 invert" />
          <div>
            <h2 className="font-display text-lg font-semibold">¿Todavía no tienes cuenta?</h2>
            <p className="text-sm opacity-90">
              Registrate gratis y elige tus categorías favoritas para recibir un resumen semanal
              de ofertas nuevas y personalizadas para ti.
            </p>
          </div>
        </div>
        <Link
          href="/registro"
          className="shrink-0 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ember"
        >
          Crear cuenta gratis
        </Link>
      </div>
    </div>
  );
}
