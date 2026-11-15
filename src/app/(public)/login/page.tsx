import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { LoginForm } from "@/modules/auth/components/LoginForm/LoginForm";

export const metadata: Metadata = {
    title: "Entrar",
};

export default async function LoginPage() {
    // Quem já está autenticado não precisa ver o login.
    if (await getSession()) {
        redirect("/dashboard");
    }

    return <LoginForm />;
}
