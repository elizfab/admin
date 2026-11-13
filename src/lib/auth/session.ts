import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { UnauthorizedError } from "../errors/app-error";
import { auth } from "./auth";

/**
 * Lê a sessão atual validando-a no banco.
 * `cache` evita consultar o banco mais de uma vez na mesma requisição
 * (ex.: layout + página pedindo a sessão).
 */
export const getSession = cache(async () => {
    return auth.api.getSession({ headers: await headers() });
});

/** Para páginas e layouts: sem sessão, redireciona para /login. */
export async function requireSession() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    return session;
}

/** Autorização: exige um papel específico (ex.: "ADMIN"). */
export async function requireRole(role: "ADMIN" | "USER") {
    const session = await requireSession();

    if (session.user.role !== role) {
        redirect("/dashboard");
    }

    return session;
}

/**
 * Para Route Handlers e Server Actions: sem sessão, lança UnauthorizedError
 * (vira 401 na API). APIs não redirecionam.
 */
export async function requireApiSession() {
    const session = await getSession();

    if (!session) {
        throw new UnauthorizedError();
    }

    return session;
}

