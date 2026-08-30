const ICONS: Record<string, React.ReactNode> = {
  Bancos: (
    <>
      <rect x="14" y="42" width="72" height="8" rx="2" />
      <rect x="20" y="50" width="8" height="28" />
      <rect x="38" y="50" width="8" height="28" />
      <rect x="54" y="50" width="8" height="28" />
      <rect x="70" y="50" width="8" height="28" />
      <path d="M14 42 L50 18 L86 42 Z" />
      <rect x="14" y="78" width="72" height="8" rx="2" />
    </>
  ),
  Entretenimiento: (
    <>
      <rect x="16" y="24" width="68" height="46" rx="6" />
      <path d="M40 36 L64 47 L40 58 Z" fill="#fff" />
    </>
  ),
  Farmacias: (
    <>
      <rect x="20" y="20" width="60" height="60" rx="14" />
      <rect x="42" y="32" width="16" height="36" rx="4" fill="#fff" />
      <rect x="32" y="42" width="36" height="16" rx="4" fill="#fff" />
    </>
  ),
  Supermercados: (
    <>
      <path d="M22 30 h56 l-8 34 h-40 z" />
      <circle cx="40" cy="76" r="6" />
      <circle cx="62" cy="76" r="6" />
      <path d="M14 20 h10 l4 10" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    </>
  ),
  Restaurantes: (
    <>
      <path
        d="M28 16 v28 M22 16 v18 a6 6 0 0 0 12 0 v-18 M34 16 v18 a6 6 0 0 1 -12 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M28 44 v40" stroke="currentColor" strokeWidth="5" fill="none" />
      <path
        d="M66 16 c-10 0 -14 10 -10 20 c2 5 8 8 8 8 v40"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </>
  ),
  "Ropa y Moda": <path d="M35 18 L50 28 L65 18 L82 30 L70 42 L64 36 V82 H36 V36 L30 42 L18 30 Z" />,
  Tecnología: (
    <>
      <rect x="18" y="24" width="64" height="42" rx="5" />
      <rect x="40" y="72" width="20" height="6" rx="2" fill="#fff" />
      <rect x="30" y="66" width="40" height="6" rx="2" fill="#fff" />
    </>
  ),
  Otros: (
    <>
      <circle cx="30" cy="50" r="9" />
      <circle cx="50" cy="50" r="9" />
      <circle cx="70" cy="50" r="9" />
    </>
  ),
};

const DEFAULT_COLOR = { bg: "#EEE3D4", fg: "#7A6F61" };

export const CATEGORIA_COLORS: Record<string, { bg: string; fg: string }> = {
  Bancos: { bg: "#FBE4DC", fg: "#D6401F" },
  Entretenimiento: { bg: "#FDEAD2", fg: "#F2762E" },
  Farmacias: { bg: "#FCEFD2", fg: "#B9791A" },
  Supermercados: { bg: "#EAF1E7", fg: "#3F7D53" },
  Restaurantes: { bg: "#FBE4DC", fg: "#D6401F" },
  "Ropa y Moda": { bg: "#F3E7F2", fg: "#8A4F82" },
  Tecnología: { bg: "#E4ECF2", fg: "#3B6C93" },
  Otros: DEFAULT_COLOR,
};

export function categoriaColor(nombre: string) {
  return CATEGORIA_COLORS[nombre] ?? DEFAULT_COLOR;
}

export default function CategoriaIcon({ nombre, className }: { nombre: string; className?: string }) {
  const path = ICONS[nombre] ?? ICONS.Otros;
  const { fg } = categoriaColor(nombre);
  return (
    <svg viewBox="0 0 100 100" className={className} fill={fg} color={fg} aria-hidden="true">
      {path}
    </svg>
  );
}
