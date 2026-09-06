import type { Metadata } from "next";
import { FlameIcon } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Quiénes somos",
  description: "La misión detrás de Encuentra Ofertas PTY: ofertas reales de comercios de Panamá, revisadas antes de publicarse.",
};

export default function QuienesSomosPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6">
      <div className="flex flex-col items-start gap-3">
        <FlameIcon className="h-10 w-10" />
        <h1 className="font-display text-3xl font-semibold text-ink">Quiénes somos</h1>
      </div>

      <div className="flex flex-col gap-5 text-ink/90">
        <p>
          Encuentra Ofertas PTY nace de una idea simple: en Panamá se mueven descuentos y
          promociones todos los días, pero suelen quedar dispersos entre redes sociales,
          grupos de WhatsApp y vitrinas de comercios que nunca llegan a todo el mundo.
          Armamos un solo lugar donde encontrarlas.
        </p>
        <p>
          A diferencia de un buscador automático, cada oferta que ves publicada pasó por
          una revisión antes de llegar al feed. Cualquier persona puede publicar una
          promoción de un comercio, pero ninguna se muestra públicamente sin que un
          administrador la apruebe primero — así evitamos spam, precios inventados y
          ofertas vencidas.
        </p>
        <p>
          Los comercios locales pueden crear su propio perfil, publicar sus promociones y
          llegar a más clientes en su provincia; los usuarios pueden guardar sus categorías
          favoritas, marcar ofertas como favoritas y recibir un resumen cuando aparece algo
          nuevo que les interesa.
        </p>
        <p>
          Seguimos construyendo Encuentra Ofertas PTY con el mismo objetivo de siempre:
          que encontrar una buena oferta en Panamá sea rápido, confiable y gratis.
        </p>
        <p className="text-sm text-muted">
          ¿Preguntas, sugerencias o querés reportar algo? Escribinos desde{" "}
          <a href="/contacto" className="font-semibold text-ember hover:underline">
            la página de Contacto
          </a>
          .
        </p>
      </div>
    </main>
  );
}
