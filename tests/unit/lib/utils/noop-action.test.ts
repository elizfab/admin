import { noopAction } from "@/lib/utils/noop-action";

it("noopAction não faz nada e devolve estado vazio (null)", async () => {
    await expect(noopAction()).resolves.toBeNull();
});
