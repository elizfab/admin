"use client"; // Error boundaries precisam ser Client Components

import { useEffect } from "react";

import { EmptyState } from "@/components/shared/EmptyState/EmptyState";

export default function PrivateError({ error, retry }: { error: unknown; retry: () => void }) {
    useEffect(() => {
        // Futuramente: enviar para um serviço de observabilidade.
        console.error(error);
    }, [error]);

    return (
        <EmptyState
            title="Algo deu errado"
            description="Não foi possível carregar esta página. Tente novamente."
            action={
                <button type="button" onClick={() => retry()}>
                    Tentar novamente
                </button>
            }
        />
    );
}
