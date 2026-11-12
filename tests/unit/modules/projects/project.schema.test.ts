import { createProjectSchema, updateProjectSchema } from "@/modules/schemas/project.schema";


describe("createProjectSchema", () => {
    it("aceita um projeto válido e aplica o status padrão", () => {
        const result = createProjectSchema.safeParse({ name: "Personal Platform" });

        expect(result.success).toBe(true);
        expect(result.data?.status).toBe("PLANNED");
    });

    it("remove espaços e rejeita nome curto", () => {
        const result = createProjectSchema.safeParse({ name: "  AB  " });

        expect(result.success).toBe(false);
    });

    it("converte campos vazios do formulário em null", () => {
        const result = createProjectSchema.safeParse({
            name: "Portal",
            description: "   ",
            repositoryUrl: "",
        });

        expect(result.data?.description).toBeNull();
        expect(result.data?.repositoryUrl).toBeNull();
    });

    it("exige https no link do repositório", () => {
        const result = createProjectSchema.safeParse({
            name: "Portal",
            repositoryUrl: "http://github.com/elizfab/portal",
        });

        expect(result.success).toBe(false);
    });

    it("rejeita status desconhecido", () => {
        const result = createProjectSchema.safeParse({ name: "Portal", status: "ARCHIVED" });

        expect(result.success).toBe(false);
    });
});

describe("updateProjectSchema", () => {
    it("não injeta status padrão em atualização parcial", () => {
        const result = updateProjectSchema.safeParse({ name: "Novo nome" });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ name: "Novo nome" });
    });

    it("rejeita atualização sem nenhum campo", () => {
        expect(updateProjectSchema.safeParse({}).success).toBe(false);
    });
});
