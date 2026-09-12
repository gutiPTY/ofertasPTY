import Link from "next/link";
import Logo from "@/components/Logo";

export default function Footer() {
  const anio = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surface-2">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Logo />

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <Link href="/quienes-somos" className="hover:text-ink">
            Quiénes somos
          </Link>
          <Link href="/privacidad" className="hover:text-ink">
            Política de privacidad
          </Link>
          <Link href="/terminos" className="hover:text-ink">
            Términos de servicio
          </Link>
          <Link href="/contacto" className="hover:text-ink">
            Contacto
          </Link>
        </nav>

        <p className="text-xs text-muted">© {anio} Encuentra Ofertas PTY</p>
      </div>
    </footer>
  );
}
