import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { defineConfig } from "vitest/config";

// Los tests SIEMPRE corren contra .env.test (Postgres local, ver
// TESTING.md) — nunca contra .env (producción). Sin esto, un timeout a
// mitad de un beforeAll/afterAll podía dejar ofertas de prueba visibles
// en el feed público real.
config({ path: fileURLToPath(new URL(".env.test", import.meta.url)) });

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
