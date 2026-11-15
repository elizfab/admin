"use client";

import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
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
    const [showPassword, setShowPassword] = useState(false);

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
        <div className={styles.card}>
            <div className={styles.visual}>
                <div className={styles.brandBadge}>
                    <Image
                        src="/admin.png"
                        alt=""
                        width={56}
                        height={56}
                        className={styles.brandIcon}
                        aria-hidden="true"
                    />
                </div>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.heading}>
                    <h1 className={styles.title}>Bem-vinda de volta</h1>
                    <p className={styles.subtitle}>Acesse sua conta para continuar</p>
                </div>

                <div className={styles.field}>
                    <label htmlFor="email">E-mail</label>
                    <div className={styles.inputWrap}>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="voce@exemplo.com"
                            required
                        />
                    </div>
                </div>

                <div className={styles.field}>
                    <label htmlFor="password">Senha</label>
                    <div className={styles.inputWrap}>
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="Sua senha"
                            className={styles.hasToggle}
                            required
                        />
                        <button
                            type="button"
                            className={styles.eyeButton}
                            onClick={() => setShowPassword((value) => !value)}
                            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                            aria-pressed={showPassword}
                        >
                            {showPassword ? (
                                <EyeOff size={16} aria-hidden="true" />
                            ) : (
                                <Eye size={16} aria-hidden="true" />
                            )}
                        </button>
                    </div>
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
        </div>
    );
}
