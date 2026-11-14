import { defineConfig, devices } from "@playwright/test";

import { E2E_BASE_URL, E2E_PORT, e2eServerEnv, testUsers } from "./tests/e2e/support/e2e-env";

export default defineConfig({
    testDir: "./tests/e2e",
    globalSetup: "./tests/e2e/global-setup.ts",

    // Um worker: os testes compartilham o mesmo banco; em série fica previsível.
    workers: 1,
    fullyParallel: false,

    // No CI: falha se alguém esquecer um test.only; tenta de novo 2x.
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,

    reporter: [["list"], ["html", { open: "never" }]],

    use: {
        baseURL: E2E_BASE_URL,
        locale: "pt-BR",
        timezoneId: "America/Sao_Paulo",
        // Evidências só quando algo falha.
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
    },

    projects: [
        { name: "setup", testMatch: /.*\.setup\.ts/ },
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"], storageState: testUsers.owner.storageState },
            dependencies: ["setup"],
        },
    ],

    // Sobe a aplicação de PRODUÇÃO (build + start) apontando para o banco de teste.
    webServer: {
        command: `npm run build && npm run start -- --port ${E2E_PORT}`,
        url: `${E2E_BASE_URL}/api/v1/health`,
        env: e2eServerEnv,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
    },
});
