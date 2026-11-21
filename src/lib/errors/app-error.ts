/**
 * Erros de aplicação: cada um carrega o código HTTP e uma mensagem
 * SEGURA para mostrar ao cliente. Detalhes internos nunca vão aqui.
 */
export type ErrorCode =
    "VALIDATION_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT";

export type FieldErrors = Record<string, string[] | undefined>;

export class AppError extends Error {
    constructor(
        public readonly code: ErrorCode,
        message: string,
        public readonly status: number,
        public readonly fieldErrors?: FieldErrors,
    ) {
        super(message);
        this.name = new.target.name;
    }
}

export class ValidationError extends AppError {
    constructor(fieldErrors?: FieldErrors, message = "Dados inválidos.") {
        super("VALIDATION_ERROR", message, 400, fieldErrors);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Não autenticado.") {
        super("UNAUTHORIZED", message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Acesso negado.") {
        super("FORBIDDEN", message, 403);
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Recurso não encontrado.") {
        super("NOT_FOUND", message, 404);
    }
}

export class ConflictError extends AppError {
    constructor(message = "Conflito com um recurso existente.") {
        super("CONFLICT", message, 409);
    }
}
