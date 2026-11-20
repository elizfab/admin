import { act, renderHook } from "@testing-library/react";

import { useSignOut } from "@/components/layout/Header/UserMenu/useSignOut";
import { authClient } from "@/lib/auth/auth-client";

const router = { push: jest.fn(), refresh: jest.fn() };

jest.mock("next/navigation", () => ({ useRouter: () => router }));
jest.mock("@/lib/auth/auth-client", () => ({ authClient: { signOut: jest.fn() } }));

beforeEach(() => jest.clearAllMocks());

it("encerra a sessão no servidor e volta para o login, nessa ordem", async () => {
    const calls: string[] = [];
    jest.mocked(authClient.signOut).mockImplementation(async () => {
        calls.push("signOut");
        return {} as never;
    });
    router.push.mockImplementation(() => calls.push("push"));
    router.refresh.mockImplementation(() => calls.push("refresh"));

    const { result } = renderHook(() => useSignOut());
    await act(() => result.current());

    expect(router.push).toHaveBeenCalledWith("/login");
    expect(calls).toEqual(["signOut", "push", "refresh"]);
});
