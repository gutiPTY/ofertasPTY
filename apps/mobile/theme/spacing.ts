export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;

// Web solo usa rounded-full (pills) o rounded-2xl/16px (cards) — nada
// intermedio (ver apps/web/components/OfertaCard.tsx).
export const radii = { pill: 999, card: 16, sm: 8 } as const;
