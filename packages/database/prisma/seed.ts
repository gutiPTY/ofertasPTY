import "dotenv/config";
import { prisma } from "../src/client";

const CATEGORIAS = [
  "Supermercados",
  "Bancos",
  "Farmacias",
  "Restaurantes",
  "Tecnología",
  "Ropa y Moda",
  "Entretenimiento",
  "Otros",
];

async function main() {
  for (const nombre of CATEGORIAS) {
    await prisma.categoria.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }
  console.log(`Seed OK: ${CATEGORIAS.length} categorías.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
