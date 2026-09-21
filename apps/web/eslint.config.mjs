import next from "@ofertaspty/config/eslint/next.js";

export default [
  ...next,
  {
    // next.config.mjs corre en Node al momento del build, fuera del
    // tsconfig de la app (por eso no tiene los tipos ambientales de Node
    // que sí ven los .ts) — sin esto, `process` queda como no-undef.
    files: ["next.config.mjs"],
    languageOptions: {
      globals: { process: "readonly" },
    },
  },
];
