/**
 * @jest-environment node
 */
// Ambiente "node" (e não jsdom): Request/Response do servidor existem aqui.
import { ConflictError, ValidationError } from "@/lib/errors/app-error";
import { apiError, ok, readJson } from "@/lib/http/api-response";

describe("api-response", () => {
    it("envolve o sucesso em { data }", async () => {
        const response = ok({ id: "1" });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ data: { id: "1" } });
    });

    it("converte AppError no formato padrão com o status correto", async () => {
        const response = apiError(new ConflictError("Nome em uso."));

        expect(response.status).toBe(409);
        expect(await response.json()).toEqual({
            error: { code: "CONFLICT", message: "Nome em uso." },
        });
    });

    it("inclui fieldErrors em erros de validação", async () => {
        const response = apiError(new ValidationError({ name: ["Obrigatório."] }));

        expect((await response.json()).error.fieldErrors).toEqual({ name: ["Obrigatório."] });
    });

    it("nunca expõe a mensagem de um erro inesperado", async () => {
        jest.spyOn(console, "error").mockImplementation(() => {});
        const response = apiError(new Error("senha do banco: 123"));
        const body = JSON.stringify(await response.json());

        expect(response.status).toBe(500);
        expect(body).not.toContain("senha");
    });

    it("transforma JSON malformado em ValidationError", async () => {
        const request = new Request("http://localhost", { method: "POST", body: "{ruim" });

        await expect(readJson(request)).rejects.toBeInstanceOf(ValidationError);
    });
});
