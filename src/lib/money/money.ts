/**
 * Dinheiro no projeto = CENTAVOS em número inteiro (R$ 12,34 → 1234).
 *
 * Por quê: número com vírgula (float) não representa 0,1 exatamente;
 * 0.1 + 0.2 dá 0.30000000000000004. Somando centavos inteiros, a conta
 * sempre fecha.
 */

const brlFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

const inputFormatter = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

/** 123456 → "R$ 1.234,56" (para exibir). */
export function formatCents(cents: number): string {
    return brlFormatter.format(cents / 100);
}

/** 123456 → "1.234,56" (valor inicial de um campo de formulário). */
export function centsToInput(cents: number): string {
    return inputFormatter.format(cents / 100);
}

/**
 * Converte o que a pessoa digitou em centavos.
 * Aceita "1234", "1234,5", "1.234,56", "R$ 1.234,56" e "1234.56".
 * Devolve NaN quando o texto não é um valor válido (o Zod transforma em erro).
 *
 * Não usa parseFloat: separa reais e centavos como TEXTO, sem arredondamento.
 */
export function parseMoneyToCents(input: string): number {
    let text = input.replace(/R\$/g, "").replace(/\s/g, "");

    if (text.includes(",")) {
        // Formato brasileiro: ponto = milhar, vírgula = decimal.
        text = text.replace(/\./g, "").replace(",", ".");
    } else if (!/^\d+\.\d{1,2}$/.test(text)) {
        // Sem vírgula, ponto só é decimal em "1234.56"; senão é milhar ("1.234").
        text = text.replace(/\./g, "");
    }

    const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(text);

    if (!match) return Number.NaN;

    const [, reais, centavos = ""] = match;

    return Number(reais) * 100 + Number(centavos.padEnd(2, "0"));
}
