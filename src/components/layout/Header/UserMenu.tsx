"use client";

import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu/DropdownMenu";
import { authClient } from "@/lib/auth/auth-client";

import styles from "./Header.module.scss";

type UserMenuProps = {
    userName: string;
};

export function UserMenu({ userName }: UserMenuProps) {
    const router = useRouter();

    async function handleSignOut() {
        // Encerra a sessão no servidor (apaga do banco) e remove o cookie.
        await authClient.signOut();
        router.push("/login");
        router.refresh();
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className={styles.userButton}>
                <UserRound size={18} aria-hidden="true" />
                <span className={styles.userName}>{userName}</span>
                <ChevronDown size={16} aria-hidden="true" />
            </DropdownMenuTrigger>

            <DropdownMenuContent>
                <DropdownMenuLabel>Conta</DropdownMenuLabel>
                <DropdownMenuItem disabled>
                    <UserRound size={16} aria-hidden="true" />
                    Perfil (em breve)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut}>
                    <LogOut size={16} aria-hidden="true" />
                    Sair
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
