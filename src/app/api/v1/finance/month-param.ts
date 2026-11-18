import { currentMonth } from "@/lib/dates/month";
import { ValidationError } from "@/lib/errors/app-error";
import { monthSchema } from "@/modules/finance";

/**
 * Lê ?month=AAAA-MM da URL. Ausente → mês atual.
 * Na API, mês inválido é ERRO 400 (quem chama precisa saber que errou);
 * na tela, o mesmo caso só cai no mês atual.
 */
export function readMonthParam(request: Request): string {
    const month = new URL(request.url).searchParams.get("month");

    if (month === null) return currentMonth();

    const parsed = monthSchema.safeParse(month);

    if (!parsed.success) {
        throw new ValidationError({ month: ["Mês inválido. Use AAAA-MM."] });
    }

    return parsed.data;
}
