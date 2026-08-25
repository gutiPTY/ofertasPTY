export const PROVINCIAS_PANAMA = [
  "Bocas del Toro",
  "Coclé",
  "Colón",
  "Chiriquí",
  "Darién",
  "Herrera",
  "Los Santos",
  "Panamá",
  "Panamá Oeste",
  "Veraguas",
  "Guna Yala",
  "Emberá-Wounaan",
  "Ngäbe-Buglé",
] as const;

export type ProvinciaPanama = (typeof PROVINCIAS_PANAMA)[number];
