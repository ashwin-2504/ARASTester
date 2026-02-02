module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
  ],
  parserOptions: {
    project: "./tsconfig.json",
  },
  rules: {
    // HARD RULES
    "@typescript-eslint/no-explicit-any": "error",

    // Ban ts-ignore entirely
    "@typescript-eslint/ban-ts-comment": [
      "error",
      {
        "ts-ignore": "ban-ts-ignore",
        "ts-expect-error": "allow-with-description",
        minimumDescriptionLength: 10,
      },
    ],

    // Additional strictness
    "@typescript-eslint/no-unsafe-assignment": "warn", // Warn for now, upgrade to error later if clean
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unsafe-call": "warn",
    "@typescript-eslint/no-unsafe-return": "warn",

    // Unused vars check
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  },
  overrides: [
    {
      files: ["**/*.jsx", "**/*.js"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-var-requires": "off", // Allow require in js files (dev-runner, electron main)
      },
    },
  ],
  ignorePatterns: ["dist", "node_modules", "*.cjs", "dev-runner.js"],
};
