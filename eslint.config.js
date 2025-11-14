import { includeIgnoreFile } from "@eslint/compat";
import eslint from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import eslintPluginAstro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y";
import pluginReact from "eslint-plugin-react";
import reactCompiler from "eslint-plugin-react-compiler";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

// File path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

const baseConfig = tseslint.config({
  extends: [eslint.configs.recommended, tseslint.configs.strict, tseslint.configs.stylistic],
  rules: {
    "no-console": "off", // Temporarily disabled
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "warn", // Changed to warning
    "@typescript-eslint/no-explicit-any": "warn", // Changed to warning
    "@typescript-eslint/no-non-null-assertion": "warn", // Changed to warning
  },
});

const jsxA11yConfig = tseslint.config({
  files: ["**/*.{js,jsx,ts,tsx}"],
  extends: [jsxA11y.flatConfigs.recommended],
  languageOptions: {
    ...jsxA11y.flatConfigs.recommended.languageOptions,
  },
  rules: {
    ...jsxA11y.flatConfigs.recommended.rules,
    "jsx-a11y/no-autofocus": "off", // Temporarily disabled
    "jsx-a11y/click-events-have-key-events": "warn", // Changed to warning
    "jsx-a11y/no-static-element-interactions": "warn", // Changed to warning
  },
});

const reactConfig = tseslint.config({
  files: ["**/*.{js,jsx,ts,tsx}"],
  extends: [pluginReact.configs.flat.recommended],
  languageOptions: {
    ...pluginReact.configs.flat.recommended.languageOptions,
    globals: {
      window: true,
      document: true,
    },
  },
  plugins: {
    "react-hooks": eslintPluginReactHooks,
    "react-compiler": reactCompiler,
  },
  settings: { react: { version: "detect" } },
  rules: {
    ...eslintPluginReactHooks.configs.recommended.rules,
    "react/react-in-jsx-scope": "off",
    "react-compiler/react-compiler": "warn", // Changed to warning
    "react/no-unescaped-entities": "warn", // Changed to warning
    "react-hooks/exhaustive-deps": "warn", // Changed to warning
  },
});

export default tseslint.config(
  includeIgnoreFile(gitignorePath),
  {
    ignores: ["src/pages/api-docs.astro", "src/pages/generate.astro"], // Inline scripts cause parser issues
  },
  baseConfig,
  jsxA11yConfig,
  reactConfig,
  eslintPluginAstro.configs["flat/recommended"],
  eslintPluginPrettier,
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "tests/**/*"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-useless-constructor": "off",
      "@typescript-eslint/no-extraneous-class": "off",
    },
  }
);
