module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  // Parser options project removed from root to avoid applying to all files
  parserOptions: {
    // project removed
  },
  rules: {
    // HARD RULES
    "@typescript-eslint/no-explicit-any": "warn",

    // Ban ts-ignore entirely
    // "@typescript-eslint/ban-ts-comment": [
    //   "error",
    //   {
    //     "ts-ignore": "ban-ts-ignore",
    //     "ts-expect-error": "allow-with-description",
    //     minimumDescriptionLength: 10,
    //   },
    // ],

    // Unused vars check
    // "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      extends: ["plugin:@typescript-eslint/recommended-type-checked"],
      parserOptions: {
        project: ["./tsconfig.eslint.json", "./tsconfig.preload.json"],
      },
      rules: {
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unsafe-assignment": "warn",
        "@typescript-eslint/no-unsafe-member-access": "warn",
        "@typescript-eslint/no-unsafe-call": "warn",
        "@typescript-eslint/no-unsafe-return": "warn",
        "@typescript-eslint/no-unsafe-argument": "warn",
        "@typescript-eslint/no-misused-promises": "warn",
        "@typescript-eslint/no-floating-promises": "warn",
        "@typescript-eslint/require-await": "warn",
        "@typescript-eslint/no-redundant-type-constituents": "warn",
        "@typescript-eslint/no-base-to-string": "warn",
        "@typescript-eslint/restrict-template-expressions": "warn",
        "@typescript-eslint/unbound-method": "warn",
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { argsIgnorePattern: "^_" },
        ],
      },
    },
    {
      files: ["*.js", "*.jsx", "**/*.js", "**/*.jsx"],
      env: {
        node: true,
        es2020: true,
      },
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
