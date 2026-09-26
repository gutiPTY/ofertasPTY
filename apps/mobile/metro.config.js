const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// pnpm usa symlinks en node_modules; Metro necesita este override explícito
// para resolver paquetes del workspace (@ofertaspty/*) desde fuera de
// apps/mobile. disableHierarchicalLookup queda en false (default) a propósito:
// pnpm anida las dependencias transitivas dentro de node_modules/.pnpm/, y
// solo la búsqueda jerárquica normal de Metro atraviesa esa estructura
// (ver incidente: "Unable to resolve expo-modules-core" / "invariant" con
// disableHierarchicalLookup en true).
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
