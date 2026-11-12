import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";

export async function GET() {
    const session = await getSession();

    // Em APIs não se redireciona: responde 401 (não autenticado).
    if (!session) {
        return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
    }

    const { id, name, email, role } = session.user;

    // Retorna somente o necessário — nunca tokens ou dados da sessão.
    return NextResponse.json({ id, name, email, role });
}
