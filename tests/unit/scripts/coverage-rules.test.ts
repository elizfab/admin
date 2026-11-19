import {
    checkBaseline,
    checkChangedFiles,
    checksChangedFiles,
    isInCoverageScope,
    parseIgnoreRevs,
    toBaseline,
    type FileSummary,
} from "../../../scripts/coverage-rules";

function summary(pct: number, total = 10): FileSummary {
    const metric = { total, covered: Math.round((total * pct) / 100), pct };
    return { lines: metric, statements: metric, branches: metric, functions: metric };
}

describe("isInCoverageScope", () => {
    it.each([
        "src/lib/money/money.ts",
        "src/modules/dashboard/services/dashboard-module.service.ts",
        "src/components/shared/BackLink/BackLink.tsx",
    ])("mede %s", (file) => {
        expect(isInCoverageScope(file)).toBe(true);
    });

    it.each([
        "src/app/(private)/dashboard/page.tsx",
        "src/modules/dashboard/index.ts",
        "src/modules/dashboard/server.ts",
        "src/modules/dashboard/types/dashboard.types.ts",
        "src/generated/prisma/client.ts",
        "src/types/global.d.ts",
        "src/modules/dashboard/components/ModuleCard/ModuleCard.module.scss",
        "tests/unit/lib/money/money.test.ts",
        "src/lib/env/required-env.test.ts",
        "docs/CHANGELOG.md",
    ])("ignora %s", (file) => {
        expect(isInCoverageScope(file)).toBe(false);
    });
});

describe("checkChangedFiles", () => {
    it("aceita arquivo alterado com tudo ≥ 95%", () => {
        const result = checkChangedFiles(["src/lib/money/money.ts"], {
            "src/lib/money/money.ts": summary(95),
        });

        expect(result).toEqual([]);
    });

    it("recusa arquivo novo abaixo de 95%, citando as métricas", () => {
        const file = "src/modules/x/services/x.service.ts";
        const result = checkChangedFiles([file], {
            [file]: { ...summary(100), lines: { total: 10, covered: 6, pct: 60 } },
        });

        expect(result).toEqual([{ file, problems: ["linhas 60%"] }]);
    });

    it("recusa arquivo do escopo sem dados de cobertura (nenhum teste o carregou)", () => {
        const file = "src/modules/x/rules/x.rules.ts";

        expect(checkChangedFiles([file], {})).toEqual([
            { file, problems: ["sem dados de cobertura"] },
        ]);
    });

    it("ignora arquivos fora do escopo e métricas sem itens (ex.: arquivo sem ramos)", () => {
        const file = "src/lib/utils/cn.ts";
        const noBranches = { ...summary(100), branches: { total: 0, covered: 0, pct: 0 } };

        expect(
            checkChangedFiles(["src/app/page.tsx", "README.md", file], { [file]: noBranches }),
        ).toEqual([]);
    });
});

describe("parseIgnoreRevs", () => {
    it("lê os SHAs do .git-blame-ignore-revs, ignorando comentários e linhas vazias", () => {
        const text = "# só formatação\n\n# style: …\n5ba40ff751e370d1af8126df83738c03a783c911\n";

        expect(parseIgnoreRevs(text)).toEqual(["5ba40ff751e370d1af8126df83738c03a783c911"]);
    });
});

describe("linha de base do total", () => {
    it("toBaseline guarda as 4 métricas com 2 casas", () => {
        expect(toBaseline(summary(33.456))).toEqual({
            lines: 33.46,
            statements: 33.46,
            branches: 33.46,
            functions: 33.46,
        });
    });

    it("aceita total igual ou maior que a linha de base", () => {
        expect(checkBaseline(summary(40), toBaseline(summary(40)))).toEqual([]);
        expect(checkBaseline(summary(41), toBaseline(summary(40)))).toEqual([]);
    });

    it("tolera variação de até 0,1 ponto (arredondamento)", () => {
        expect(checkBaseline(summary(39.95), toBaseline(summary(40)))).toEqual([]);
    });

    it("recusa total menor que a linha de base", () => {
        expect(checkBaseline(summary(38), toBaseline(summary(40)))).toEqual([
            "linhas caiu de 40% para 38%",
            "comandos caiu de 40% para 38%",
            "ramos caiu de 40% para 38%",
            "funções caiu de 40% para 38%",
        ]);
    });
});

describe("checksChangedFiles (qual PR confere arquivo por arquivo)", () => {
    it.each([
        ["develop", true],
        [undefined, true],
        ["", true],
        ["main", false],
    ])("base %j → %s", (baseRef, expected) => {
        // develop ← feature/*: confere cada arquivo. main ← develop (release): os
        // arquivos já foram conferidos nos PRs das features; só o total conta.
        expect(checksChangedFiles(baseRef)).toBe(expected);
    });
});
