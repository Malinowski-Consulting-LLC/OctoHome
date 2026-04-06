import typescriptEslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [".worktrees/**", ".next/**", "dist/**", "build/**"],
  },
  ...typescriptEslint.configs.recommended,
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@typescript-eslint/no-explicit-any": "off",
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
