import { cn } from "@/lib/utils/cn";

describe("cn", () => {
    it("junta várias classes com espaço", () => {
        expect(cn("a", "b", "c")).toBe("a b c");
    });

    it("ignora valores falsos", () => {
        const isActive = false;

        expect(cn("item", isActive && "item-active", null, undefined)).toBe("item");
    });

    it("retorna string vazia quando não há classes", () => {
        expect(cn()).toBe("");
    });
});
