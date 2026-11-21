/**
 * Action vazia e ESTÁVEL (mesma referência sempre) para o `useActionState`
 * quando uma parte do formulário não tem action (ex.: página sem obras).
 * Hooks não podem ser condicionais, então o hook existe e recebe esta action.
 */
export async function noopAction(): Promise<null> {
    return null;
}
