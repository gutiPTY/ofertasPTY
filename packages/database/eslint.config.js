import base from "@ofertaspty/config/eslint/node.js";

export default [
  ...base,
  {
    // Scripts CLI de uso puntual (seed, bootstrap de admin, setup de Storage):
    // console.log es la salida esperada para un operador humano, no un logger
    // de servidor en producción.
    files: ["prisma/seed.ts", "scripts/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
];
