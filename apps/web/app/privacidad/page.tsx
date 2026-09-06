import type { Metadata } from "next";

const EMAIL_CONTACTO = "contacto@ofertaspty.app";
const ULTIMA_ACTUALIZACION = "5 de septiembre de 2026";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Qué datos recopila Encuentra Ofertas PTY, para qué se usan y cómo ejercer tus derechos sobre ellos.",
};

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-xl font-semibold text-ink">{titulo}</h2>
      <div className="flex flex-col gap-3 text-ink/90">{children}</div>
    </section>
  );
}

export default function PrivacidadPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold text-ink">Política de privacidad</h1>
        <p className="text-sm text-muted">Última actualización: {ULTIMA_ACTUALIZACION}</p>
      </div>

      <p className="text-ink/90">
        Esta política explica qué información recopila Encuentra Ofertas PTY (&ldquo;la
        plataforma&rdquo;, &ldquo;nosotros&rdquo;) cuando usás el sitio, para qué la usamos
        y qué podés hacer si querés acceder, corregir o eliminar tus datos.
      </p>

      <Seccion titulo="Qué datos recopilamos">
        <p>
          <strong>Cuenta:</strong> email y nombre al registrarte (por email/contraseña o con
          tu cuenta de Google). La autenticación la maneja Supabase Auth; nosotros no
          almacenamos tu contraseña.
        </p>
        <p>
          <strong>Actividad en la plataforma:</strong> las ofertas que publicás (título,
          descripción, imágenes, precio, categoría, provincia), tus favoritos, los reportes
          que hacés sobre una oferta, tus categorías y provincias preferidas (para las
          alertas), y tu puntaje de reputación.
        </p>
        <p>
          <strong>Si registrás un comercio:</strong> nombre del comercio, dirección, RUC,
          dirección fiscal, representante legal y el aviso de operaciones que subís para
          verificarlo. Ese documento se guarda en un almacenamiento privado, no público.
        </p>
      </Seccion>

      <Seccion titulo="Para qué usamos tus datos">
        <p>
          Para mostrar tus ofertas en el feed público una vez aprobadas por un
          administrador, para moderar el contenido y prevenir fraude o abuso, para
          enviarte correos transaccionales (confirmación de cuenta, aprobación o rechazo de
          una oferta, resumen semanal si activaste alertas de categorías), y para mantener
          tu cuenta y tus preferencias funcionando entre visitas.
        </p>
      </Seccion>

      <Seccion titulo="Con quién compartimos datos">
        <p>
          No vendemos tus datos. Los compartimos únicamente con los proveedores que
          necesitamos para operar la plataforma: Supabase (autenticación, base de datos y
          almacenamiento de imágenes/documentos), Resend (envío de correos), y Vercel /
          Railway (hosting). Si ves anuncios en el sitio, Google AdSense puede usar cookies
          propias para mostrarlos — no controlamos esas cookies directamente.
        </p>
      </Seccion>

      <Seccion titulo="Retención de datos">
        <p>
          Por razones de auditoría y prevención de fraude, el registro de moderación de una
          oferta (quién la publicó, quién la revisó y por qué) se conserva en nuestros
          registros internos aunque la oferta deje de mostrarse públicamente — nunca
          borramos ese historial, solo lo ocultamos del sitio.
        </p>
      </Seccion>

      <Seccion titulo="Tus derechos">
        <p>
          Podés editar tu perfil y tus preferencias, borrar tus favoritos, o eliminar una
          oferta propia desde la plataforma en cualquier momento. Para pedirnos acceder a
          tus datos, corregirlos o eliminar tu cuenta por completo, escribinos a{" "}
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
        <p>
          Tratamos tus datos de acuerdo con la Ley 81 de 2019 sobre Protección de Datos
          Personales de la República de Panamá.
        </p>
      </Seccion>

      <Seccion titulo="Cambios a esta política">
        <p>
          Si actualizamos esta política de forma relevante, lo vamos a reflejar en esta
          misma página con una nueva fecha de actualización.
        </p>
      </Seccion>
    </main>
  );
}
