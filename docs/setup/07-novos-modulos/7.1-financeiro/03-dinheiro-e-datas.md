# Passo 03 — Dinheiro e datas

> **Fase:** 07 — Novos Módulos\
> **Tempo estimado:** 45 min\
> **Depende de:** [Passo 02](02-modelo-e-migration.md)

## Objetivo

Criar dois utilitários **genéricos** (servem a qualquer módulo futuro):
`lib/money` (centavos ⇄ texto em reais) e `lib/dates/month` (mês, fuso de
São Paulo e datas sem hora), cobertos por 22 testes.

## 💡 Por que dois arquivos só para isso

Dinheiro e data são os dois lugares onde aplicações financeiras mais erram, e
os erros são **silenciosos**: a tela mostra um número plausível, mas errado.

**Dinheiro.** 💡 Pense num caixa que só aceita moedas de 1 centavo: ele nunca
"arredonda", só conta moedas. É o que fazemos ao guardar `1234` em vez de
`12.34`. O texto que a pessoa digita ("1.234,56") é convertido **como texto**,
separando reais e centavos, sem passar por `parseFloat`:

```ts
parseFloat("0.29") * 100   // 28.999999999999996 ❌
parseMoneyToCents("0,29")  // 29 ✅
```

**Datas sem hora.** O banco guarda o dia 17/11 como `2026-11-17T00:00:00Z`
(meia-noite em **UTC**). Em São Paulo (UTC−3), esse instante é **16/11 às
21h**. Se a tela formatar no fuso local, a despesa "volta um dia". Regra:
**data sem hora se formata em UTC**. Já o "mês atual" e o "hoje" são
perguntas sobre o **relógio da usuária**, então usam `America/Sao_Paulo`.

| Pergunta | Fuso | Função |
|---|---|---|
| Que dia/mês é **agora** para a Liza? | `America/Sao_Paulo` | `today()`, `currentMonth()` |
| Qual dia está **guardado** na transação? | `UTC` | `formatDay()`, `dayToInput()` |
| Quais dias pertencem a novembro? | `UTC` | `monthRange()` → `[01/11, 01/12)` |

💡 O intervalo do mês é **semiaberto**: começa no dia 1º (incluído) e termina
no dia 1º do mês seguinte (**excluído**). Assim não é preciso saber se o mês
tem 28, 30 ou 31 dias.

## Pré-requisitos

- Passo 02 concluído (typecheck passando).

## Passo a passo

### 1. Criar `src/lib/money/money.ts`

`src/lib/money/money.ts`:

```ts
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
```

### 2. Criar `src/lib/dates/month.ts`

`src/lib/dates/month.ts`:

```ts
/**
 * Utilitários de MÊS ("2026-11") e de DATA SEM HORA ("2026-11-17").
 *
 * Datas sem hora são guardadas como meia-noite em UTC (@db.Date no Prisma).
 * Por isso, ao exibir, formate em UTC: em America/Sao_Paulo (UTC-3), a
 * meia-noite UTC do dia 17 ainda é dia 16 às 21h, e a data apareceria errada.
 */

export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const TIME_ZONE = "America/Sao_Paulo";

/** Mês atual no fuso da usuária, no formato "AAAA-MM". */
export function currentMonth(now = new Date()): string {
    // en-CA formata como AAAA-MM-DD.
    return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now).slice(0, 7);
}

/** Hoje no fuso da usuária, no formato "AAAA-MM-DD" (valor de um <input type="date">). */
export function today(now = new Date()): string {
    return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

/** Intervalo [início, fim) do mês, em UTC, para filtrar no banco. */
export function monthRange(month: string): { start: Date; end: Date } {
    const [year, monthIndex] = month.split("-").map(Number);

    return {
        start: new Date(Date.UTC(year, monthIndex - 1, 1)),
        end: new Date(Date.UTC(year, monthIndex, 1)),
    };
}

/** "2026-11" + 1 → "2026-12"; "2026-01" - 1 → "2025-12". */
export function shiftMonth(month: string, delta: number): string {
    const [year, monthIndex] = month.split("-").map(Number);
    const date = new Date(Date.UTC(year, monthIndex - 1 + delta, 1));

    return date.toISOString().slice(0, 7);
}

const monthLabelFormatter = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
});

/** "2026-11" → "novembro de 2026". */
export function formatMonth(month: string): string {
    return monthLabelFormatter.format(monthRange(month).start);
}

const dayFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" });

/** Data sem hora vinda do banco → "17/11/2026". */
export function formatDay(date: Date): string {
    return dayFormatter.format(date);
}

/** Data sem hora vinda do banco → "2026-11-17" (valor de um <input type="date">). */
export function dayToInput(date: Date): string {
    return date.toISOString().slice(0, 10);
}
```

💡 Por que `en-CA` no `currentMonth`? O formato canadense de data é
`AAAA-MM-DD`, exatamente o formato ISO que precisamos. É um truque comum para
obter a data **em um fuso específico** sem biblioteca extra.

### 3. Criar os testes

`tests/unit/lib/money/money.test.ts`:

```ts
import { centsToInput, formatCents, parseMoneyToCents } from "@/lib/money/money";

// Intl usa espaço não separável entre "R$" e o número; normalizamos para comparar.
const normalize = (text: string) => text.replace(/\s/g, " ");

describe("parseMoneyToCents", () => {
    it.each([
        ["1234", 123400],
        ["1234,5", 123450],
        ["1.234,56", 123456],
        ["R$ 1.234,56", 123456],
        ["1234.56", 123456],
        ["1.234", 123400],
        ["0,01", 1],
        [" 12,30 ", 1230],
    ])("%s → %i centavos", (input, cents) => {
        expect(parseMoneyToCents(input)).toBe(cents);
    });

    it.each(["", "abc", "12,345", "1,2,3", "-10", "12.3.4,5,6"])("recusa %p (NaN)", (input) => {
        expect(parseMoneyToCents(input)).toBeNaN();
    });

    it("não sofre erro de ponto flutuante", () => {
        // parseFloat("0.29") * 100 = 28.999999999999996
        expect(parseMoneyToCents("0,29")).toBe(29);
    });
});

describe("formatação", () => {
    it("formatCents exibe em reais", () => {
        expect(normalize(formatCents(123456))).toBe("R$ 1.234,56");
    });

    it("centsToInput gera o texto do campo, sem símbolo", () => {
        expect(centsToInput(123456)).toBe("1.234,56");
        expect(parseMoneyToCents(centsToInput(123456))).toBe(123456);
    });
});
```

`tests/unit/lib/dates/month.test.ts`:

```ts
import {
    currentMonth,
    dayToInput,
    formatDay,
    formatMonth,
    monthRange,
    shiftMonth,
    today,
} from "@/lib/dates/month";

describe("utilitários de mês", () => {
    it("monthRange devolve [1º dia, 1º dia do mês seguinte) em UTC", () => {
        const { start, end } = monthRange("2026-12");

        expect(start.toISOString()).toBe("2026-12-01T00:00:00.000Z");
        expect(end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
    });

    it("shiftMonth atravessa a virada do ano", () => {
        expect(shiftMonth("2026-01", -1)).toBe("2025-12");
        expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    });

    it("currentMonth e today usam o fuso de São Paulo", () => {
        // 01/12 às 01h UTC ainda é 30/11 às 22h em São Paulo.
        const instant = new Date("2026-12-01T01:00:00.000Z");

        expect(currentMonth(instant)).toBe("2026-11");
        expect(today(instant)).toBe("2026-11-30");
    });

    it("formatMonth escreve o mês por extenso", () => {
        expect(formatMonth("2026-11")).toBe("novembro de 2026");
    });

    it("datas sem hora não 'voltam um dia' ao formatar", () => {
        const day = new Date("2026-11-17T00:00:00.000Z");

        expect(formatDay(day)).toBe("17/11/2026");
        expect(dayToInput(day)).toBe("2026-11-17");
    });
});
```

💡 O teste "currentMonth e today usam o fuso de São Paulo" fixa o instante
`01/12 às 01h UTC`: no Brasil ainda é **30/11**. É o tipo de bug que só
aparece na virada do mês, à noite, e por isso precisa de um teste explícito.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/lib/money/money.ts` | Criado | `formatCents`, `centsToInput`, `parseMoneyToCents` |
| `src/lib/dates/month.ts` | Criado | `currentMonth`, `today`, `monthRange`, `shiftMonth`, `formatMonth`, `formatDay`, `dayToInput` |
| `tests/unit/lib/money/money.test.ts` | Criado | 17 testes |
| `tests/unit/lib/dates/month.test.ts` | Criado | 5 testes |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npx jest tests/unit/lib/money tests/unit/lib/dates` | `Tests: 22 passed` |
| 2 | `npm run typecheck && npm run lint` | Sem erros |

**Critério de aceite:** os 22 testes passam, incluindo o de ponto flutuante e
o da virada do mês.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Expected "R$ 1.234,56"` e recebeu algo "igual" | O `Intl` usa **espaço não separável** (` `) depois de `R$` | Compare com `normalize()`, como no teste |
| Data aparece um dia antes na tela | Formatação no fuso local | Use `formatDay()` (UTC) para datas guardadas |
| `currentMonth()` errado só à noite | Usou `new Date().toISOString()` (UTC) | Use `currentMonth()`, que usa o fuso de São Paulo |

## Commit sugerido

```bash
git add src/lib/money src/lib/dates tests/unit/lib/money tests/unit/lib/dates
git commit -m "feat(lib): adiciona utilitários de dinheiro e de mês"
```

## Referências

- [MDN — `Intl.NumberFormat`](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
- [MDN — `Intl.DateTimeFormat` (`timeZone`)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [What Every Programmer Should Know About Floating-Point](https://floating-point-gui.de/)

---

← [Passo anterior](02-modelo-e-migration.md) · [Índice da fase](README.md) · [Próximo passo](04-tipos-e-schemas.md) →
