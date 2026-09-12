import type { Metadata } from "next";

const EMAIL_CONTACTO = "contacto@ofertaspty.app";
const ULTIMA_ACTUALIZACION = "12 de septiembre de 2026";

export const metadata: Metadata = {
  title: "Términos de servicio",
  description: "Reglas de uso de Encuentra Ofertas PTY: qué podés publicar, cómo funciona la moderación y qué responsabilidad tiene cada parte.",
};

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-xl font-semibold text-ink">{titulo}</h2>
      <div className="flex flex-col gap-3 text-ink/90">{children}</div>
    </section>
  );
}

export default function TerminosPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold text-ink">Términos de servicio</h1>
        <p className="text-sm text-muted">Última actualización: {ULTIMA_ACTUALIZACION}</p>
      </div>

      <p className="text-ink/90">
        Al registrarte o usar Encuentra Ofertas PTY (&ldquo;la plataforma&rdquo;,
        &ldquo;nosotros&rdquo;) aceptás estos términos. Si no estás de acuerdo con alguno,
        no deberías usar el sitio.
      </p>

      <Seccion titulo="Qué es Encuentra Ofertas PTY">
        <p>
          Somos un espacio gratuito y colaborativo donde cualquier usuario registrado puede
          publicar ofertas de comercios en Panamá para que otros las descubran. No vendemos
          vouchers ni procesamos pagos ni canjes — solo mostramos información sobre
          promociones que existen en el comercio real. Cualquier compra o canje ocurre
          directamente entre vos y el comercio, fuera de la plataforma.
        </p>
      </Seccion>

      <Seccion titulo="Moderación de contenido">
        <p>
          Ninguna oferta se muestra en el feed público sin que un administrador la revise y
          la apruebe primero — esto aplica también a los comercios con plan pago, que nunca
          se saltan la moderación. Un administrador puede rechazar, editar datos menores u
          ocultar cualquier oferta que no cumpla con estas reglas, y esa decisión queda
          registrada internamente para auditoría.
        </p>
      </Seccion>

      <Seccion titulo="Tu responsabilidad al publicar">
        <p>
          Al publicar una oferta, garantizás que la información es real, vigente y que
          tenés derecho a usar las imágenes que subís. No está permitido publicar
          promociones falsas o vencidas, precios inventados, contenido ofensivo, ni usar la
          plataforma para spam. Publicar contenido falso de forma repetida puede resultar en
          la suspensión de tu cuenta.
        </p>
        <p>
          Un usuario no puede reportar la misma oferta más de una vez, y no podés valorar ni
          reportar tus propias ofertas.
        </p>
      </Seccion>

      <Seccion titulo="Sistema de reputación">
        <p>
          Publicar ofertas que se aprueban suma puntos de reputación; publicar ofertas que
          se rechazan o son reportadas y confirmadas como inválidas resta puntos. Este
          puntaje es visible en tu perfil y no afecta ningún cobro ni beneficio económico.
        </p>
      </Seccion>

      <Seccion titulo="Comercios">
        <p>
          Si registrás un comercio, además aceptás que verifiquemos los datos que nos das
          (RUC, dirección fiscal, representante legal, aviso de operaciones) antes de
          habilitar tu perfil. Un plan pago te da prioridad de visibilidad, pero no te exime
          de la revisión de cada oferta.
        </p>
      </Seccion>

      <Seccion titulo="Sin garantías sobre las ofertas">
        <p>
          Hacemos lo posible por mantener la calidad del contenido a través de la
          moderación, pero no garantizamos la disponibilidad, el precio final ni la
          vigencia exacta de ninguna promoción publicada por un tercero — esa información
          depende del comercio. Si una oferta ya venció o cambió, podés reportarla.
        </p>
      </Seccion>

      <Seccion titulo="Suspensión de cuentas">
        <p>
          Podemos suspender una cuenta que publique contenido falso de forma repetida,
          abuse del sistema de reportes, o viole estos términos. Podés pedirnos eliminar tu
          cuenta por completo en cualquier momento escribiendo a{" "}
          <a href={`mailto:${EMAIL_CONTACTO}`} className="font-semibold text-ember hover:underline">
            {EMAIL_CONTACTO}
          </a>
          .
        </p>
      </Seccion>

      <Seccion titulo="Menores de edad">
        <p>Encuentra Ofertas PTY no está dirigida a personas menores de 18 años.</p>
      </Seccion>

      <Seccion titulo="Marco legal">
        <p>Estos términos se rigen por las leyes de la República de Panamá.</p>
      </Seccion>

      <Seccion titulo="Cambios a estos términos">
        <p>
          Si actualizamos estos términos de forma relevante, lo vamos a reflejar en esta
          misma página con una nueva fecha de actualización.
        </p>
      </Seccion>
    </main>
  );
}
