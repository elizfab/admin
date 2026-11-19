// Confere a meta de cobertura depois de `npm run test:coverage` (T-0010).
// Uso: npx tsx scripts/coverage-check.ts              → confere (sai 1 se falhar)
//      npx tsx scripts/coverage-check.ts --update-baseline → grava o total atual como linha de base
// Base da comparação: origin/$GITHUB_BASE_REF no PR; senão $COVERAGE_BASE ou origin/develop.
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";

import {
    checkBaseline,
    checkChangedFiles,
    COVERAGE_TARGET,
    parseIgnoreRevs,
    toBaseline,
    type Baseline,
    type FileSummary,
} from "./coverage-rules";

const SUMMARY_PATH = resolve("coverage/coverage-summary.json");
const BASELINE_PATH = resolve("coverage-baseline.json");

function git(...args: string[]): string[] {
    return execFileSync("git", args, { encoding: "utf8" }).split("\n").filter(Boolean);
}

function changedFiles(): string[] {
    const base =
        process.env.COVERAGE_BASE ??
        (process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : "origin/develop");
    const [mergeBase] = git("merge-base", base, "HEAD");
    const ignored = new Set(
        existsSync(".git-blame-ignore-revs")
            ? parseIgnoreRevs(readFileSync(".git-blame-ignore-revs", "utf8"))
            : [],
    );
    // Commits da branch, exceto os só de formatação (.git-blame-ignore-revs).
    const commits = git("rev-list", `${mergeBase}..HEAD`).filter((sha) => !ignored.has(sha));
    const existing = new Set(git("ls-files"));

    return [
        ...new Set([
            ...commits.flatMap((sha) =>
                git("diff-tree", "--no-commit-id", "--name-only", "-r", "--diff-filter=AMR", sha),
            ),
            ...git("diff", "--name-only", "--diff-filter=AMR", "HEAD"), // área de trabalho
            ...git("ls-files", "--others", "--exclude-standard"), // arquivos novos
        ]),
    ].filter((file) => existing.has(file) || existsSync(file)); // apagado depois não conta
}

function report(lines: string[]) {
    const text = lines.join("\n");
    console.log(text);
    if (process.env.GITHUB_STEP_SUMMARY)
        appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`);
}

if (!existsSync(SUMMARY_PATH)) {
    console.error(
        "Rode `npm run test:coverage` antes (coverage/coverage-summary.json não existe).",
    );
    process.exit(1);
}

const raw = JSON.parse(readFileSync(SUMMARY_PATH, "utf8")) as Record<string, FileSummary>;
const { total, ...byAbsolutePath } = raw;
const summaries = Object.fromEntries(
    Object.entries(byAbsolutePath).map(([file, summary]) => [
        relative(process.cwd(), file),
        summary,
    ]),
);

if (process.argv.includes("--update-baseline")) {
    writeFileSync(BASELINE_PATH, `${JSON.stringify(toBaseline(total), null, 2)}\n`);
    console.log(`Linha de base atualizada em coverage-baseline.json:`, toBaseline(total));
    process.exit(0);
}

const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8")) as Baseline;
const fileProblems = checkChangedFiles(changedFiles(), summaries);
const baselineProblems = checkBaseline(total, baseline);
const current = toBaseline(total);

report([
    "## Cobertura de testes (unitários + integração)",
    "",
    "| Métrica | Total atual | Linha de base |",
    "|---|---|---|",
    `| Linhas | ${current.lines}% | ${baseline.lines}% |`,
    `| Comandos | ${current.statements}% | ${baseline.statements}% |`,
    `| Ramos | ${current.branches}% | ${baseline.branches}% |`,
    `| Funções | ${current.functions}% | ${baseline.functions}% |`,
    "",
    fileProblems.length === 0
        ? `✅ Todos os arquivos novos/alterados do escopo têm ≥ ${COVERAGE_TARGET}%.`
        : `❌ Arquivos novos/alterados abaixo de ${COVERAGE_TARGET}%:\n\n${fileProblems
              .map(({ file, problems }) => `- \`${file}\`: ${problems.join(", ")}`)
              .join("\n")}`,
    "",
    baselineProblems.length === 0
        ? "✅ O total não caiu."
        : `❌ O total caiu:\n\n${baselineProblems.map((problem) => `- ${problem}`).join("\n")}`,
]);

if (fileProblems.length > 0 || baselineProblems.length > 0) {
    console.log(
        "\nVeja as linhas sem teste em coverage/lcov-report/index.html. Subiu a cobertura de propósito? `npm run coverage:baseline`.",
    );
    process.exitCode = 1;
}
