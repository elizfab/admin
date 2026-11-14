import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

// Testes de integração: banco REAL de teste (admin_test). Rodar com `npm run test:integration`.
const config: Config = {
    testEnvironment: "node",
    // Roda antes de cada arquivo de teste: aponta DATABASE_URL para o banco de teste.
    setupFiles: ["<rootDir>/tests/integration/setup-env.ts"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
        // O client do Prisma 7 importa o motor de consultas em ESM (.mjs), que o
        // Jest (CommonJS) não carrega. O pacote traz a versão CommonJS equivalente (.js).
        "^@prisma/client/runtime/(query_compiler_fast_bg\\.postgresql(?:\\.wasm-base64)?)\\.mjs$":
            "<rootDir>/node_modules/@prisma/client/runtime/$1.js",
    },
    testMatch: ["<rootDir>/tests/integration/**/*.test.ts"],
};

export default createJestConfig(config);
