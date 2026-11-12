"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth/auth-client";

import styles from "./LoginForm.module.scss";

// Mensagem genérica: não revela se o e-mail existe (evita enumeração de contas).
const INVALID_CREDENTIALS = "E-mail ou senha inválidos.";
const TOO_MANY_ATTEMPTS = "Muitas tentativas. Aguarde um minuto e tente novamente.";

export function LoginForm() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const formData = new FormData(event.currentTarget);

        const { error: signInError } = await authClient.signIn.email({
            email: String(formData.get("email")),
            password: String(formData.get("password")),
        });

        if (signInError) {
            setError(signInError.status === 429 ? TOO_MANY_ATTEMPTS : INVALID_CREDENTIALS);
            setIsSubmitting(false);
            return;
        }

        // refresh() faz os Server Components relerem a sessão recém-criada.
        router.push("/dashboard");
        router.refresh();
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <h1 className={styles.title}>Entrar</h1>

            <div className={styles.field}>
                <label htmlFor="email">E-mail</label>
                <input id="email" name="email" type="email" autoComplete="email" required />
            </div>

            <div className={styles.field}>
                <label htmlFor="password">Senha</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                />
            </div>

            {error && (
                <p className={styles.error} role="alert">
                    {error}
                </p>
            )}

            <button className={styles.submit} type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Entrando…" : "Entrar"}
            </button>
        </form>
    );
}
