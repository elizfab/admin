import type { Config } from "jest";

import { coverageScope } from "./jest.coverage-scope.mjs";

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
    // Escopo medido: o mesmo do `npm test` (jest.coverage-scope.mjs).
    collectCoverageFrom: coverageScope,
};

export default config;
