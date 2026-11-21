// Regras de branch do repositório: fonte única usada pelo Danger (dangerfile.ts)
// e pelo workflow de PR automático (scripts/check-branch.ts).
// Fluxo aceito: feature/<slug> → develop → main.

export type BranchCheck = { ok: true } | { ok: false; reason: string };

/** `feature/<slug>`: minúsculas, números e `-`, `.` ou `_` entre eles; sem subpastas. */
export const FEATURE_BRANCH = /^feature\/[a-z0-9]+(?:[-._][a-z0-9]+)*$/;

const FEATURE_HINT =
    "Use o padrão `feature/<slug>` em minúsculas (ex.: `feature/t-0007-filtro-categoria`).";

/** Push em uma branch de trabalho: só `feature/*` abre PR automático. */
export function checkPushBranch(branch: string): BranchCheck {
    if (FEATURE_BRANCH.test(branch)) return { ok: true };
    return {
        ok: false,
        reason: `A branch \`${branch}\` não é aceita: só branches feature/* abrem PR para a develop. ${FEATURE_HINT}`,
    };
}

/** PR: `feature/*` → `develop` e `develop` → `main` (produção). Nada mais. */
export function checkPullRequest(head: string, base: string): BranchCheck {
    if (base === "develop") {
        if (FEATURE_BRANCH.test(head)) return { ok: true };
        return {
            ok: false,
            reason: `PR para a \`develop\` só a partir de feature/*; recebido \`${head}\`. ${FEATURE_HINT}`,
        };
    }
    if (base === "main") {
        if (head === "develop") return { ok: true };
        return {
            ok: false,
            reason: `A \`main\` (produção) só recebe PR da \`develop\`; recebido \`${head}\`. Abra o PR da sua feature para a develop.`,
        };
    }
    return {
        ok: false,
        reason: `Base \`${base}\` não aceita: abra o PR para a \`develop\` (features) ou para a \`main\` (só a partir da develop).`,
    };
}
