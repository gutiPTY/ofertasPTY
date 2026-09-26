// Calcado de los tokens Tailwind de apps/web (apps/web/app/globals.css,
// apps/web/tailwind.config.ts) para que ambos códigos hablen el mismo
// lenguaje de diseño aunque no compartan paquete todavía. Solo modo claro:
// mobile fuerza userInterfaceStyle "light" en app.json.
export const colors = {
  ink: "#1b1512",
  paper: "#fbf7f1",
  surface: "#f3ebe0",
  surface2: "#eee3d4",
  line: "#e3d6c3",
  muted: "#6a5f52",
  ember: "#b3361a",
  emberInk: "#ffffff",
  flare: "#c34f0c",
  spark: "#ffc53d",
  sparkBg: "#fdf1d6",
  success: "#3c7850",
  successBg: "#e6f0e8",
  warning: "#946115",
  warningBg: "#faedd8",
  critical: "#b23a48",
  criticalBg: "#f6e3e3",
} as const;

// Paleta de categorías (apps/web/components/CategoriaIcon.tsx líneas 77-88).
export const categoryColors: Record<string, { bg: string; fg: string }> = {
  Bancos: { bg: "#FBE4DC", fg: "#B3361A" },
  Entretenimiento: { bg: "#FDEAD2", fg: "#C34F0C" },
  Farmacias: { bg: "#FCEFD2", fg: "#9B6616" },
  Supermercados: { bg: "#EAF1E7", fg: "#3C7850" },
  Restaurantes: { bg: "#FBE4DC", fg: "#B3361A" },
  "Ropa y Moda": { bg: "#F3E7F2", fg: "#8A4F82" },
  Tecnología: { bg: "#E4ECF2", fg: "#3B6C93" },
  Otros: { bg: "#EEE3D4", fg: "#6A5F52" },
};

export const DEFAULT_CATEGORY_COLOR = categoryColors.Otros;

export function categoriaColor(nombre: string) {
  return categoryColors[nombre] ?? DEFAULT_CATEGORY_COLOR;
}
