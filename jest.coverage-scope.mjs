/**
 * Escopo da cobertura, o MESMO em `npm test` (só unitários) e em `npm run test:coverage`
 * (unitários + integração, que vale para a meta R16). Fora dele: src/app/** (páginas e
 * route handlers, provados pelo E2E), barris index.ts/server.ts, tipos (pastas types/ e arquivos *.types.ts), testes e gerados.
 * Espelhado em scripts/coverage-rules.ts (isInCoverageScope).
 */
/** @type {string[]} */
export const coverageScope = [
    "src/lib/**/*.{ts,tsx}",
    "src/modules/**/*.{ts,tsx}",
    "src/components/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/index.ts",
    "!src/**/server.ts",
    "!src/**/types/**",
    "!src/**/*.types.ts",
    "!src/generated/**",
];
