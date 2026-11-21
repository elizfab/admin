import {
    categoriasDoGrupo,
    categoriaLabel,
    grupoDaCategoria,
    gruposDaObra,
    OBRA_CATEGORIAS,
    OBRA_GRUPOS,
    obraCategoriaIds,
} from "@/modules/construction/constants/categories";
import {
    createProjectSchema,
    createServiceSchema,
    updateProjectSchema,
    updateServiceSchema,
} from "@/modules/construction/schemas/construction.schema";

describe("catálogo de grupos e categorias (fonte única)", () => {
    it("todo grupo tem id e rótulo; toda categoria aponta para um grupo existente", () => {
        const grupoIds = new Set(OBRA_GRUPOS.map((g) => g.id));

        for (const grupo of OBRA_GRUPOS) {
            expect(grupo.id).toBeTruthy();
            expect(grupo.label).toBeTruthy();
        }
        for (const categoria of OBRA_CATEGORIAS) {
            expect(grupoIds.has(categoria.grupoId)).toBe(true);
            expect(obraCategoriaIds).toContain(categoria.id);
        }
    });

    it("Lavanderia tem as 3 categorias da especificação", () => {
        expect(categoriasDoGrupo("lavanderia").map((c) => c.id)).toEqual([
            "lavanderia",
            "escritorio-lavanderia",
            "banheiro-lavanderia",
        ]);
    });

    it("grupoDaCategoria e categoriaLabel resolvem pelo catálogo", () => {
        expect(grupoDaCategoria("banheiro-lavanderia")?.id).toBe("lavanderia");
        expect(categoriaLabel("escritorio-lavanderia")).toBe("Escritório da Lavanderia");
        expect(categoriaLabel("desconhecida")).toBe("desconhecida");
    });

    it("grupoDaCategoria devolve undefined para id desconhecido", () => {
        expect(grupoDaCategoria("inventada")).toBeUndefined();
    });

    it("gruposDaObra deriva os grupos das categorias (sem salvar grupo)", () => {
        expect(gruposDaObra(["banheiro-lavanderia"]).map((g) => g.id)).toEqual(["lavanderia"]);
        expect(gruposDaObra([])).toEqual([]);
    });
});

describe("createProjectSchema — categoryIds", () => {
    const base = { name: "Obra teste" };

    it("aceita categorias do catálogo (várias)", () => {
        const parsed = createProjectSchema.parse({
            ...base,
            categoryIds: ["lavanderia", "banheiro-lavanderia"],
        });

        expect(parsed.categoryIds).toEqual(["lavanderia", "banheiro-lavanderia"]);
    });

    it("omite categoryIds quando não enviado", () => {
        expect(createProjectSchema.parse(base).categoryIds).toBeUndefined();
    });

    it("recusa categoria fora do catálogo", () => {
        const result = createProjectSchema.safeParse({ ...base, categoryIds: ["inventada"] });

        expect(result.success).toBe(false);
    });
});

describe("updateProjectSchema — categoryIds", () => {
    it("aceita lista vazia (remove todas as categorias)", () => {
        expect(updateProjectSchema.parse({ categoryIds: [] })).toEqual({ categoryIds: [] });
    });

    it("recusa categoria fora do catálogo", () => {
        expect(updateProjectSchema.safeParse({ categoryIds: ["x"] }).success).toBe(false);
    });

    it("payload vazio falha no refine (pelo menos um campo)", () => {
        expect(updateProjectSchema.safeParse({}).success).toBe(false);
    });
});

describe("schemas de serviço — preprocess de dinheiro e texto", () => {
    const base = {
        phaseId: "fase-1",
        trade: "MASON",
        description: "Reboco",
        contractedCents: 100000,
    };

    it("contratado em centavos (número) passa direto pelo preprocess", () => {
        const parsed = createServiceSchema.parse(base);

        expect(parsed.contractedCents).toBe(100000);
    });

    it("contratado em texto '1.234,56' vira centavos", () => {
        const parsed = createServiceSchema.parse({ ...base, contractedCents: "1.234,56" });

        expect(parsed.contractedCents).toBe(123456);
    });

    it("areaId '' (select vazio) vira undefined; id passa direto", () => {
        const semArea = createServiceSchema.parse({ ...base, areaId: "" });
        expect(semArea.areaId).toBeUndefined();

        const comArea = createServiceSchema.parse({ ...base, areaId: "area-1" });
        expect(comArea.areaId).toBe("area-1");
    });

    it("texto opcional não-string cai na validação de string", () => {
        const result = createServiceSchema.safeParse({
            ...base,
            professionalName: 42,
        });

        expect(result.success).toBe(false);
    });

    it("texto opcional vazio vira undefined", () => {
        const parsed = createServiceSchema.parse({ ...base, notes: "   " });

        expect(parsed.notes).toBeUndefined();
    });

    it("updateServiceSchema vazio falha no refine", () => {
        expect(updateServiceSchema.safeParse({}).success).toBe(false);
    });
});
