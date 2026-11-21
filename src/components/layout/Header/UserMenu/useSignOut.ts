import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { authClient } from "@/lib/auth/auth-client";

/** Encerra a sessão no servidor (apaga do banco e remove o cookie) e volta para o login. */
export function useSignOut() {
    const router = useRouter();

    return useCallback(async () => {
        await authClient.signOut();
        router.push("/login");
        router.refresh();
    }, [router]);
}
