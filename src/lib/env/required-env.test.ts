import { assertProductionEnv, findEnvProblems } from "@/lib/env/required-env";

const valid = {
    DATABASE_URL: "postgresql://u:p@host:6543/postgres",
    BETTER_AUTH_SECRET: "a".repeat(32),
    BETTER_AUTH_URL: "https://personal-platform-admin.vercel.app",
};

describe("findEnvProblems", () => {
    it("aceita um ambiente completo", () => {
        expect(findEnvProblems(valid)).toEqual([]);
    });

    it("aceita BETTER_AUTH_ALLOWED_HOSTS no lugar de BETTER_AUTH_URL (previews)", () => {
        const previewEnv = {
            ...valid,
            BETTER_AUTH_URL: undefined,
            BETTER_AUTH_ALLOWED_HOSTS: "app-*.vercel.app",
        };

        expect(findEnvProblems(previewEnv)).toEqual([]);
    });

    it("aponta segredo ausente ou curto", () => {
        expect(findEnvProblems({ ...valid, BETTER_AUTH_SECRET: undefined })).toContain(
            "BETTER_AUTH_SECRET não definida.",
        );
        expect(findEnvProblems({ ...valid, BETTER_AUTH_SECRET: "curto" })).toContain(
            "BETTER_AUTH_SECRET precisa ter pelo menos 32 caracteres.",
        );
    });

    it("lista todos os problemas de uma vez", () => {
        expect(findEnvProblems({})).toHaveLength(3);
    });
});

describe("assertProductionEnv", () => {
    it("lança erro com a lista de problemas", () => {
        expect(() => assertProductionEnv({})).toThrow(/DATABASE_URL não definida/);
    });
});