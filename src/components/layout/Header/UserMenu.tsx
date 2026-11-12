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

import styles from "./Header.module.scss";

type UserMenuProps = {
    userName: string;
};

export function UserMenu({ userName }: UserMenuProps) {
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
                {/* O logout real será implementado na fase de autenticação. */}
                <DropdownMenuItem disabled>
                    <LogOut size={16} aria-hidden="true" />
                    Sair (em breve)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
