const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const checkoutPackageRoot = path.resolve(
  projectRoot,
  "../links/hosted-checkout-react-native"
);
const config = getDefaultConfig(projectRoot);

// The example uses the unpublished package through a local file dependency.
// Watch its source while resolving React Native peer dependencies from this app.
config.watchFolders = [checkoutPackageRoot];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules")];

module.exports = config;
