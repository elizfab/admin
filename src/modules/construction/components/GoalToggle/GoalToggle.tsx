"use client";

import { useTransition } from "react";

import { buttonClassName } from "@/components/ui/Button/Button";

import { setGoalDoneAction } from "../../actions/goal.actions";
import styles from "./GoalToggle.module.scss";

type GoalToggleProps = {
    goalId: string;
    projectId: string;
    /** Estado atual: true = já concluída (botão vira "Reabrir"). */
    done: boolean;
};

/** Botão "Concluir"/"Reabrir" de uma meta (chama a action com o estado desejado). */
export function GoalToggle({ goalId, projectId, done }: GoalToggleProps) {
    const [pending, startTransition] = useTransition();

    return (
        <button
            type="button"
            className={buttonClassName(done ? "secondary" : "primary", styles.toggle)}
            disabled={pending}
            onClick={() =>
                startTransition(() => {
                    void setGoalDoneAction(goalId, !done, projectId);
                })
            }
        >
            {pending ? "…" : done ? "Reabrir" : "Concluir"}
        </button>
    );
}
