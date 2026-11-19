import {
    checkPullRequest,
    checkPushBranch,
} from "../../../scripts/branch-rules";

describe("checkPushBranch (push que abre o PR automático)", () => {
    it.each([
        "feature/bmad-agents",
        "feature/portal-financeiro-construction",
        "feature/t-0007-filtro-categoria",
        "feature/v2.1",
    ])("aceita %s", (branch) => {
        expect(checkPushBranch(branch)).toEqual({ ok: true });
    });

    it.each([
        "fix/parcela",
        "feat/filtro",
        "docs/7.3-portal-dev-docs",
        "chore/agents",
        "Feature/Maiusculas",
        "feature/",
        "feature/com espaco",
        "feature/a/b",
        "develop",
    ])("recusa %s com explicação", (branch) => {
        const result = checkPushBranch(branch);
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toContain("feature/");
    });
});

describe("checkPullRequest (Danger)", () => {
    it("aceita feature/* → develop", () => {
        expect(checkPullRequest("feature/bmad-agents", "develop")).toEqual({ ok: true });
    });

    it("recusa outra branch → develop", () => {
        const result = checkPullRequest("fix/parcela", "develop");
        expect(result.ok).toBe(false);
    });

    it("aceita develop → main (release para produção)", () => {
        expect(checkPullRequest("develop", "main")).toEqual({ ok: true });
    });

    it("recusa feature/* direto na main", () => {
        const result = checkPullRequest("feature/bmad-agents", "main");
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toContain("develop");
    });

    it("recusa PR para outra base", () => {
        const result = checkPullRequest("feature/x", "release");
        expect(result.ok).toBe(false);
    });
});
