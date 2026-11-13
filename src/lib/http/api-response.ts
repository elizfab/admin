import { NextResponse } from "next/server";

import { AppError, ValidationError } from "@/lib/errors/app-error";

/**
 * Formato padrão das respostas da API /api/v1:
 *   sucesso → { "data": ... }
 *   erro    → { "error": { "code", "message", "fieldErrors"? } }
 */

export function ok<T>(data: T, status = 200) {
    return NextResponse.json({ data }, { status });
}

export function created<T>(data: T) {
    return ok(data, 201);
}

export function noContent() {
    return new NextResponse(null, { status: 204 });
}

export function apiError(error: unknown) {
    if (error instanceof AppError) {
        return NextResponse.json(
            {
                error: {
                    code: error.code,
                    message: error.message,
                    ...(error.fieldErrors && { fieldErrors: error.fieldErrors }),
                },
            },
            { status: error.status },
        );
    }

    // Erro inesperado: detalhe só no log do servidor; resposta genérica.
    console.error("[api] erro inesperado:", error);

    return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Erro interno. Tente novamente." } },
        { status: 500 },
    );
}

/** Lê o corpo JSON; JSON malformado vira 400, e não 500. */
export async function readJson(request: Request): Promise<unknown> {
    try {
        return await request.json();
    } catch {
        throw new ValidationError(undefined, "Corpo da requisição não é um JSON válido.");
    }
}
