import {
    createDashboardModuleSchema,
    defaultDashboardModules,
    getDashboardIcon,
    isExternalHref,
    updateDashboardModuleSchema,
} from "@/modules/dashboard";
import { LayoutDashboard, PiggyBank } from "lucide-react";

const valid = {
    slug: "release-control",
    title: "Release Control",
    description: "Controle de versões e deploys.",
    href: "/release",
    icon: "PiggyBank",
};

function errorsOf(result: {
    success: boolean;
    error?: { issues: { path: PropertyKey[]; message: string }[] };
}) {
    return Object.fromEntries(
        (result.error?.issues ?? []).map((i) => [String(i.path[0]), i.message]),
    );
}

describe("createDashboardModuleSchema", () => {
    it("aceita um card válido e usa o status padrão Disponível", () => {
        expect(createDashboardModuleSchema.parse(valid)).toEqual({ ...valid, status: "AVAILABLE" });
    });

    it("remove espaços nas pontas", () => {
        const parsed = createDashboardModuleSchema.parse({ ...valid, title: "  Release  " });

        expect(parsed.title).toBe("Release");
    });

    it.each([
        [
            "slug",
            "Release Control",
            "Use só letras minúsculas, números e hífen (ex.: release-control).",
        ],
        ["slug", "a", "O identificador precisa ter pelo menos 2 caracteres."],
        ["slug", "a".repeat(41), "O identificador pode ter no máximo 40 caracteres."],
        ["title", "R", "O título precisa ter pelo menos 2 caracteres."],
        ["title", "R".repeat(61), "O título pode ter no máximo 60 caracteres."],
        ["description", "x", "A descrição precisa ter pelo menos 2 caracteres."],
        ["description", "x".repeat(161), "A descrição pode ter no máximo 160 caracteres."],
        ["href", "finance", "Use um caminho do portal (ex.: /finance) ou uma URL https://."],
        ["href", "//evil.example", "Use um caminho do portal (ex.: /finance) ou uma URL https://."],
        [
            "href",
            "http://example.com",
            "Use um caminho do portal (ex.: /finance) ou uma URL https://.",
        ],
        [
            "href",
            "javascript:alert(1)",
            "Use um caminho do portal (ex.: /finance) ou uma URL https://.",
        ],
        ["href", "/com espaço", "Use um caminho do portal (ex.: /finance) ou uma URL https://."],
        ["href", "/" + "a".repeat(300), "O link pode ter no máximo 300 caracteres."],
        ["icon", "Skull", "Escolha um ícone da lista."],
        ["status", "LIVE", "Status inválido."],
    ])("recusa %s = %j", (field, value, message) => {
        const result = createDashboardModuleSchema.safeParse({ ...valid, [field]: value });

        expect(result.success).toBe(false);
        expect(errorsOf(result)[field]).toBe(message);
    });

    it.each(["slug", "title", "description", "href", "icon"])("exige %s", (field) => {
        const result = createDashboardModuleSchema.safeParse({ ...valid, [field]: undefined });

        expect(result.success).toBe(false);
        expect(errorsOf(result)[field]).toBeDefined();
    });

    it("aceita link externo https://", () => {
        const result = createDashboardModuleSchema.safeParse({
            ...valid,
            href: "https://docs.example.com/x",
        });

        expect(result.success).toBe(true);
    });
});

describe("updateDashboardModuleSchema (PATCH parcial, sem padrão — R7)", () => {
    it("aceita só o título e NÃO inventa status", () => {
        expect(updateDashboardModuleSchema.parse({ title: "Novo título" })).toEqual({
            title: "Novo título",
        });
    });

    it("recusa corpo vazio", () => {
        const result = updateDashboardModuleSchema.safeParse({});

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe("Informe ao menos um campo para atualizar.");
    });
});

describe("isExternalHref", () => {
    it.each([
        ["https://docs.example.com", true],
        ["/finance", false],
    ])("%s → %s", (href, expected) => {
        expect(isExternalHref(href)).toBe(expected);
    });
});

describe("getDashboardIcon", () => {
    it("devolve o ícone pelo nome guardado no banco", () => {
        expect(getDashboardIcon("PiggyBank")).toBe(PiggyBank);
    });

    it("usa um ícone neutro para nome desconhecido (dado antigo)", () => {
        expect(getDashboardIcon("Inexistente")).toBe(LayoutDashboard);
    });
});

describe("defaultDashboardModules (cards iniciais do seed)", () => {
    it("são os 2 cards iniciais e passam na validação", () => {
        expect(defaultDashboardModules.map((m) => m.slug)).toEqual(["documentation", "finance"]);

        for (const card of defaultDashboardModules) {
            expect(createDashboardModuleSchema.safeParse(card).success).toBe(true);
        }
    });
});
