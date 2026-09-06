import type { Metadata } from "next";

const EMAIL_CONTACTO = "contacto@ofertaspty.app";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escribinos a contacto@ofertaspty.app por dudas, reportes o consultas sobre Encuentra Ofertas PTY.",
};

export default function ContactoPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink">Contacto</h1>

      <div className="flex flex-col gap-4 text-ink/90">
        <p>
          ¿Tenés una duda, encontraste un problema o querés reportar algo sobre una oferta
          o un comercio? Escribinos y te respondemos a la brevedad.
        </p>
        <p>
          Si sos dueño de un comercio y querés publicar tus promociones, podés hacerlo
          directamente desde{" "}
          <a href="/comercio/solicitud" className="font-semibold text-ember hover:underline">
            Mi comercio
          </a>{" "}
          — este correo es para todo lo demás.
        </p>
      </div>

      <a
        href={`mailto:${EMAIL_CONTACTO}`}
        className="flex w-fit items-center gap-3 rounded-full bg-ember px-6 py-3 text-base font-bold text-ember-ink transition hover:brightness-95"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-10 6L2 7" />
        </svg>
        {EMAIL_CONTACTO}
      </a>
    </main>
  );
}
