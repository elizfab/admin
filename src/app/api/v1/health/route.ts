import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";

// Endpoint público de diagnóstico.
// Responde apenas o estado geral: nunca host, usuário, versão ou mensagem de erro.
export async function GET() {
    const timestamp = new Date().toISOString();

    try {
        await prisma.$queryRaw`SELECT 1`;

        return NextResponse.json({ status: "ok", database: "up", timestamp });
    } catch (error) {
        // O detalhe completo vai só para o log do servidor.
        console.error("[health] falha ao consultar o banco:", error);

        return NextResponse.json(
            { status: "degraded", database: "down", timestamp },
            { status: 503 },
        );
    }
}
