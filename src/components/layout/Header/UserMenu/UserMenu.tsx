"use client";

import { ChevronDown, LogOut, UserRound } from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu/DropdownMenu";

import styles from "./UserMenu.module.scss";
import type { UserMenuProps } from "./UserMenu.types";
import { useSignOut } from "./useSignOut";

/** Menu da conta no Header: renderiza; sair fica no useSignOut. */
export function UserMenu({ userName }: UserMenuProps) {
    const signOut = useSignOut();

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
                <DropdownMenuItem onSelect={signOut}>
                    <LogOut size={16} aria-hidden="true" />
                    Sair
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
