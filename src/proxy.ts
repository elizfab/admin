import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Redirecionamento OTIMISTA: só verifica se o cookie de sessão EXISTE.
 * Não valida o cookie — isso é feito no servidor (requireSession / getSession).
 * Serve para evitar renderizar páginas privadas para quem claramente não logou.
 */
export function proxy(request: NextRequest) {
    const sessionCookie = getSessionCookie(request);

    if (!sessionCookie) {
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    // Somente rotas privadas passam pelo proxy. /login, /api/* e estáticos ficam de fora.
    // Ao criar uma rota privada nova, adicione-a aqui.
    matcher: [
        "/dashboard/:path*",
        "/studies/:path*",
        "/finance/:path*",
        "/documentation/:path*",
        "/projects/:path*",
    ],
};
