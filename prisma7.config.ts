import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// O Next.js carrega o .env.local sozinho; o CLI do Prisma, não.
// Por isso carregamos o mesmo arquivo aqui, para uma única fonte de variáveis.
// Em CI/Vercel o arquivo não existe e as variáveis vêm do ambiente.
config({ path: ".env.local", quiet: true });

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "tsx prisma/seed.ts",
    },
    datasource: {
        // Migrations usam a conexão direta (não o pooler).
        url: process.env["DIRECT_URL"],
    },
});
