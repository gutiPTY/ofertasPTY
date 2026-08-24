import reactNative from "@ofertaspty/config/eslint/react-native.js";

export default [
  ...reactNative,
  {
    files: ["metro.config.js"],
    languageOptions: {
      globals: { require: "readonly", module: "writable", __dirname: "readonly" },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];
