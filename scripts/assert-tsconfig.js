const ts = require("typescript");
const path = require("path");

try {
  const configPath = path.resolve("tsconfig.json");
  const { config, error } = ts.readConfigFile(configPath, ts.sys.readFile);

  if (error) {
    console.error("❌ Error reading tsconfig.json:", error.messageText);
    process.exit(1);
  }

  const required = {
    strict: true,
    noImplicitAny: true,
    strictNullChecks: true,
  };

  let failed = false;

  for (const [key, value] of Object.entries(required)) {
    if (config.compilerOptions[key] !== value) {
      console.error(
        `❌ tsconfig violation: compilerOptions.${key} must be ${value}`,
      );
      failed = true;
    }
  }

  if (failed) {
    process.exit(1);
  }

  console.log("✅ tsconfig strictness verified");
} catch (error) {
  console.error("❌ Unexpected error verifying tsconfig:", error.message);
  process.exit(1);
}
