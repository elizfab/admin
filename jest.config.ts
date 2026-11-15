import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
    // Caminho da aplicação Next.js: carrega next.config.ts e arquivos .env nos testes.
    dir: "./",
});

const config: Config = {
    coverageProvider: "v8",
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    // Espelha o alias "@/*" do tsconfig.json.
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    // E2E (Playwright) e integração (precisa de banco) têm comandos próprios.
    testPathIgnorePatterns: [
        "<rootDir>/node_modules/",
        "<rootDir>/tests/e2e/",
        "<rootDir>/tests/integration/",
    ],
    collectCoverageFrom: [
        "src/**/*.{ts,tsx}",
        "!src/**/*.d.ts",
        "!src/generated/**",
    ],
};

// Exportado assim para que o next/jest consiga carregar a config do Next (assíncrona).
export default createJestConfig(config);
