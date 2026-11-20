// Regras da meta de cobertura (T-0010), usadas por scripts/coverage-check.ts:
//   1. todo arquivo novo ou alterado no escopo tem ≥ 95% em cada métrica;
//   2. o total não cai abaixo da linha de base (coverage-baseline.json).

export const COVERAGE_TARGET = 95;
/** Tolerância da linha de base, em pontos percentuais (arredondamento entre execuções). */
export const BASELINE_TOLERANCE = 0.1;

export const METRICS = ["lines", "statements", "branches", "functions"] as const;
export type Metric = (typeof METRICS)[number];

const METRIC_LABEL: Record<Metric, string> = {
    lines: "linhas",
    statements: "comandos",
    branches: "ramos",
    functions: "funções",
};

export type MetricSummary = { total: number; covered: number; pct: number };
export type FileSummary = Record<Metric, MetricSummary>;
export type Baseline = Record<Metric, number>;
export type FileProblem = { file: string; problems: string[] };

const SCOPE = /^src\/(lib|modules|components)\/.+\.tsx?$/;
// Mesmo escopo do jest.coverage.config.ts: barris, tipos e gerados ficam de fora.
const EXCLUDED = [
    /\.test\.tsx?$/,
    /\.d\.ts$/,
    /\/index\.ts$/,
    /\/server\.ts$/,
    /\/types\//,
    /\.types\.ts$/,
    /^src\/generated\//,
];

/** O arquivo entra na meta de cobertura do Jest? (`src/app/**` é provado pelo E2E.) */
export function isInCoverageScope(file: string): boolean {
    return SCOPE.test(file) && !EXCLUDED.some((pattern) => pattern.test(file));
}

/** Arquivos do escopo abaixo da meta (ou sem dados de cobertura). Caminhos relativos à raiz. */
export function checkChangedFiles(
    changedFiles: string[],
    summaries: Record<string, FileSummary>,
    target = COVERAGE_TARGET,
): FileProblem[] {
    const result: FileProblem[] = [];

    for (const file of changedFiles.filter(isInCoverageScope)) {
        const summary = summaries[file];

        if (!summary) {
            result.push({ file, problems: ["sem dados de cobertura"] });
            continue;
        }

        const problems = METRICS.filter(
            // Métrica sem itens (ex.: arquivo sem nenhum if) não tem o que cobrir.
            (metric) => summary[metric].total > 0 && summary[metric].pct < target,
        ).map((metric) => `${METRIC_LABEL[metric]} ${summary[metric].pct}%`);

        if (problems.length > 0) result.push({ file, problems });
    }

    return result;
}

/**
 * O PR confere a cobertura arquivo por arquivo? Sim para feature/* → develop.
 * No release (develop → main) os arquivos já foram conferidos nos PRs das features
 * (e o que veio antes da regra não é cobrado de novo): só o total é conferido.
 */
export function checksChangedFiles(baseRef: string | undefined): boolean {
    return baseRef !== "main";
}

/** SHAs do `.git-blame-ignore-revs` (commits só de formatação: não contam como alteração). */
export function parseIgnoreRevs(text: string): string[] {
    return text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "" && !line.startsWith("#"));
}

export function toBaseline(total: FileSummary): Baseline {
    const round = (value: number) => Math.round(value * 100) / 100;

    return {
        lines: round(total.lines.pct),
        statements: round(total.statements.pct),
        branches: round(total.branches.pct),
        functions: round(total.functions.pct),
    };
}

/** Métricas do total que caíram abaixo da linha de base. */
export function checkBaseline(
    total: FileSummary,
    baseline: Baseline,
    tolerance = BASELINE_TOLERANCE,
): string[] {
    const current = toBaseline(total);

    return METRICS.filter((metric) => current[metric] < baseline[metric] - tolerance).map(
        (metric) => `${METRIC_LABEL[metric]} caiu de ${baseline[metric]}% para ${current[metric]}%`,
    );
}
