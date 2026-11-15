import { assertTestDatabase, E2E_DATABASE_URL } from "../e2e/support/e2e-env";

// Trava de segurança: nunca rodar contra um banco que não termine em "_test".
assertTestDatabase(E2E_DATABASE_URL);

process.env.DATABASE_URL = E2E_DATABASE_URL;
