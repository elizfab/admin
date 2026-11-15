import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";

// Raiz: envia para o dashboard (com sessão) ou para o login (sem sessão).
export default async function HomePage() {
    const session = await getSession();

    redirect(session ? "/dashboard" : "/login");
}
