import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth/auth";

// Expõe os endpoints do Better Auth em /api/auth/* (sign-in, sign-out, get-session…).
export const { GET, POST } = toNextJsHandler(auth);
