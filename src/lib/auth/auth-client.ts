import { createAuthClient } from "better-auth/react";

// Cliente para Client Components. Mesmo domínio: não precisa de baseURL.
export const authClient = createAuthClient();
