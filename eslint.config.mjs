import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 250709in에서 원본 그대로 가져온 CNC 옵티마이저 코드 (src/lib/optimizer/upstream/README.md)
    "src/lib/optimizer/upstream/**",
    // Unmodified Basis Universal runtime shipped with Three.js.
    "public/three/sofa/basis/**",
    "public/three/sofa/draco/**",
  ]),
]);

export default eslintConfig;
