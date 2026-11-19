-- CreateEnum
CREATE TYPE "DashboardModuleStatus" AS ENUM ('AVAILABLE', 'EXTERNAL', 'SOON');

-- CreateTable
CREATE TABLE "dashboard_module" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(40) NOT NULL,
    "title" VARCHAR(60) NOT NULL,
    "description" VARCHAR(160) NOT NULL,
    "href" VARCHAR(300) NOT NULL,
    "icon" VARCHAR(40) NOT NULL,
    "status" "DashboardModuleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_module_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_module_ownerId_slug_key" ON "dashboard_module"("ownerId", "slug");

-- AddForeignKey
ALTER TABLE "dashboard_module" ADD CONSTRAINT "dashboard_module_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Dados iniciais (T-0007): os 3 cards que viviam no código (modules.mock.ts) passam a ser
-- dados de cada conta que já existe, para o dashboard não ficar vazio após o deploy.
-- Contas novas recebem os mesmos cards pelo seed (prisma/seed.ts).
-- createdAt com 1 ms de diferença mantém a ordem da lista (mais antigo primeiro).
INSERT INTO "dashboard_module" ("id", "slug", "title", "description", "href", "icon", "status", "ownerId", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    card.slug,
    card.title,
    card.description,
    card.href,
    card.icon,
    card.status::"DashboardModuleStatus",
    u."id",
    CURRENT_TIMESTAMP + (card.position * INTERVAL '1 millisecond'),
    CURRENT_TIMESTAMP
FROM "user" u
CROSS JOIN (
    VALUES
        (1, 'documentation', 'Portal de Documentação Dev', 'Acesso ao portal de documentação. Para desenvolvedores e interessados em conhecer a aplicação.', '/documentation', 'BookOpen', 'EXTERNAL'),
        (2, 'finance', 'Portal Financeiro', 'Receitas, despesas, saldo e obra.', '/finance', 'Wallet', 'SOON'),
        (3, 'studies', 'Portal de Estudos', 'Recursos e materiais para estudo.', '/studies', 'BookOpen', 'SOON')
) AS card(position, slug, title, description, href, icon, status);
