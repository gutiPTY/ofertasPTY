// Épica 10 — visible solo cuando la reputación del usuario alcanza el
// umbral (ver @ofertaspty/shared-types REPUTACION_INSIGNIA_UMBRAL).
export default function InsigniaColaboradorConfiable() {
  return (
    <span
      title="Colaborador confiable"
      aria-label="Colaborador confiable"
      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden="true">
        <path d="M10 1.5l2.59 5.25 5.79.84-4.19 4.09.99 5.77L10 14.77l-5.18 2.68.99-5.77-4.19-4.09 5.79-.84L10 1.5z" />
      </svg>
      Confiable
    </span>
  );
}
