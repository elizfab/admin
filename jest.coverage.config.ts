import type { Config } from "jest";

/**
 * Cobertura somada: testes unitários + integração numa execução só.
 * Rodar com `npm run test:coverage` (precisa do banco de teste, como a integração).
 * Regras da meta (≥ 95% no código novo, total não cai): scripts/coverage-check.ts.
 */
const config: Config = {
    projects: ["<rootDir>/jest.config.ts", "<rootDir>/jest.integration.config.ts"],
    collectCoverage: true,
    coverageProvider: "v8",
    coverageDirectory: "<rootDir>/coverage",
    coverageReporters: ["text-summary", "json-summary", "lcov", "html"],
    // Escopo medido pelo Jest. Fora dele: src/app/** (páginas e route handlers,
    // provados pelo E2E), barris index.ts/server.ts, tipos e código gerado.
    collectCoverageFrom: [
        "src/lib/**/*.{ts,tsx}",
        "src/modules/**/*.{ts,tsx}",
        "src/components/**/*.{ts,tsx}",
        "!src/**/*.d.ts",
        "!src/**/*.test.{ts,tsx}",
        "!src/**/index.ts",
        "!src/**/server.ts",
        "!src/**/types/**",
        "!src/generated/**",
    ],
};

export default config;
