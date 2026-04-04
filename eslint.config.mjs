import nextConfig from "eslint-config-next";
import nextTypescriptConfig from "eslint-config-next/typescript";
import nextCoreWebVitalsConfig from "eslint-config-next/core-web-vitals";

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...nextConfig,
  ...nextTypescriptConfig,
  ...nextCoreWebVitalsConfig,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@next/next/no-img-element": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
];

export default eslintConfig;
