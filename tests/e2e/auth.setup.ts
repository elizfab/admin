import { expect, test as setup } from "@playwright/test";

import { E2E_BASE_URL, testUsers } from "./support/e2e-env";

/**
 * Faz login uma vez por usuária e salva os cookies em arquivo (storageState).
 * Os testes reaproveitam essas sessões em vez de logar de novo a cada teste,
 * o que é mais rápido e não esbarra no rate limit de login (5/minuto).
 */
for (const [key, user] of Object.entries(testUsers)) {
    setup(`autentica ${key}`, async ({ request }) => {
        const response = await request.post("/api/auth/sign-in/email", {
            data: { email: user.email, password: user.password },
            headers: { Origin: E2E_BASE_URL },
        });

        expect(response.ok()).toBeTruthy();

        await request.storageState({ path: user.storageState });
    });
}
