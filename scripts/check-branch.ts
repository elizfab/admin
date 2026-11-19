// Valida o nome da branch no workflow "PR automático" (antes de abrir o PR).
// Uso: npx tsx scripts/check-branch.ts <branch>
// Sai com código 1 (e uma anotação de erro no GitHub) se a branch não for feature/*.
import { checkPushBranch } from "./branch-rules";

const branch = process.argv[2] ?? "";
const result = checkPushBranch(branch);

if (result.ok) {
    console.log(`✅ Branch \`${branch}\` aceita: o PR para a develop pode ser aberto.`);
} else {
    // `::error` vira uma anotação vermelha no resumo da execução do GitHub Actions.
    console.log(`::error title=Branch não aceita::${result.reason}`);
    process.exitCode = 1;
}
