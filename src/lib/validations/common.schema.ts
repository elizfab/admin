import { z } from "zod";

/**
 * Converte "" (campo de formulário vazio) em null antes de validar.
 * Sem isso, um <input> vazio seria gravado como texto vazio.
 */
export function emptyToNull<T extends z.ZodType>(schema: T) {
    return z.preprocess(
        (value) => (typeof value === "string" && value.trim() === "" ? null : value),
        schema.nullable(),
    );
}

/** IDs gerados com @default(cuid()) no Prisma. */
export const idSchema = z.cuid({ error: "Identificador inválido." });

/** Converte o erro do Zod em { campo: [mensagens] }. */
export function toFieldErrors(error: z.ZodError) {
    return z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
}
