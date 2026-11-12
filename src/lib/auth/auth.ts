import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/db/prisma";

const EIGHT_HOURS = 60 * 60 * 8;

export const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: "postgresql" }),

    emailAndPassword: {
        enabled: true,
        // Sem cadastro público: a conta administradora é criada pelo seed.
        disableSignUp: true,
        minPasswordLength: 12,
    },

    session: {
        expiresIn: EIGHT_HOURS,
        // Renova a validade, no máximo, uma vez por hora de uso.
        updateAge: 60 * 60,
    },

    user: {
        additionalFields: {
            // input: false → o cliente nunca consegue enviar/alterar estes campos.
            role: { type: "string", input: false },
            isActive: { type: "boolean", input: false },
        },
    },

    rateLimit: {
        enabled: true,
        // "database": o contador sobrevive a reinícios e funciona com várias
        // instâncias serverless (a memória de cada instância não é compartilhada).
        storage: "database",
        customRules: {
            "/sign-in/email": { window: 60, max: 5 },
        },
    },

    databaseHooks: {
        session: {
            create: {
                // Bloqueia login de contas desativadas (isActive = false).
                before: async (session) => {
                    const user = await prisma.user.findUnique({
                        where: { id: session.userId },
                        select: { isActive: true },
                    });

                    if (!user?.isActive) {
                        return false;
                    }

                    return { data: session };
                },
            },
        },
    },

    // Precisa ser o último plugin: permite que Server Actions gravem cookies.
    plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
