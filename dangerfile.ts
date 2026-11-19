// Danger: revisão automática de todo PR (comentário no PR + status ✅/❌).
// Regras de branch em scripts/branch-rules.ts (as mesmas do PR automático).
import { danger, fail, message, warn } from "danger";
import { checkPullRequest } from "./scripts/branch-rules";

const pr = danger.github.pr;
const head = pr.head.ref;
const base = pr.base.ref;

// 1. Tipo de branch (bloqueia o merge se falhar).
const branch = checkPullRequest(head, base);
if (branch.ok) {
    message(`✅ Branch \`${head}\` → \`${base}\` aceita.`);
} else {
    fail(branch.reason);
}

// 2. Lembretes do Definition of Done (avisam, não bloqueiam).
const changed = [...danger.git.created_files, ...danger.git.modified_files];
const touchesBehaviour = changed.some(
    (file) => file.startsWith("src/") || file.startsWith("prisma/"),
);

if (base === "develop" && touchesBehaviour) {
    if (!changed.includes("docs/CHANGELOG.md")) {
        warn("O código mudou, mas o `docs/CHANGELOG.md` não: registre a mudança (Gate G6).");
    }
    if (!changed.includes("WIP.md")) {
        warn("O `WIP.md` não foi atualizado: mova a tarefa no quadro Kanban.");
    }
}

if (changed.some((file) => file.startsWith("prisma/migrations/"))) {
    warn(
        "Este PR tem migration: confirme que é **aditiva**; destrutiva exige ADR e aprovação (R15).",
    );
}
