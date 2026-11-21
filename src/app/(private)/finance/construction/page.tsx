import type { Metadata } from "next";
import Link from "next/link";

import { createProjectAction } from "@/modules/construction/actions/project.actions";
import { ConstructionProjectGrid } from "@/modules/construction/components/ConstructionProjectGrid/ConstructionProjectGrid";
import { ConstructionGroupTabs } from "@/modules/construction/components/ConstructionGroupTabs/ConstructionGroupTabs";
import { NewConstructionProjectDialog } from "@/modules/construction/components/NewConstructionProjectDialog/NewConstructionProjectDialog";
import {
    OBRA_CATEGORIAS,
    OBRA_GRUPOS,
    categoriasDoGrupo,
    grupoDaCategoria,
    type ObraGrupoId,
} from "@/modules/construction/constants/categories";
import {
    countProjectsByCategory,
    listProjectCards,
    PROJECT_CARDS_PAGE_SIZE,
} from "@/modules/construction/server";
import { requireSession } from "@/lib/auth/session";
import { FinanceLayout } from "@/modules/finance/components/FinanceLayout/FinanceLayout";

import styles from "./page.module.scss";

export const metadata: Metadata = {
    title: "Construção",
};

const SEM_CATEGORIA = "sem-categoria";

function first(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

export default async function ConstructionPage({
    searchParams,
}: PageProps<"/finance/construction">) {
    const session = await requireSession();
    const params = await searchParams;

    const grupoParam = first(params.grupo) ?? "lavanderia";
    const categoriaParam = first(params.categoria);
    const offset = Math.max(0, Number(first(params.offset) ?? "0") || 0);

    const categoriaValida = OBRA_CATEGORIAS.find((c) => c.id === categoriaParam);
    const grupoValido = OBRA_GRUPOS.find((g) => g.id === grupoParam);

    // Visão de categoria: ?categoria=<id> — obras daquela categoria.
    if (categoriaValida) {
        const { items, hasMore } = await listProjectCards(
            session.user.id,
            { categoryId: categoriaValida.id },
            offset,
        );
        const grupo = grupoDaCategoria(categoriaValida.id);
        const nextOffset = offset + PROJECT_CARDS_PAGE_SIZE;
        const base = `/finance/construction?categoria=${categoriaValida.id}`;

        return (
            <FinanceLayout current="construction">
                <nav aria-label="Trilha" className={styles.breadcrumb}>
                    <Link href={`/finance/construction?grupo=${grupo?.id ?? "lavanderia"}`}>
                        {grupo?.label ?? "Construção"}
                    </Link>
                    <span aria-hidden="true">›</span>
                    <span aria-current="page">{categoriaValida.label}</span>
                </nav>
                <div className={styles.toolbar}>
                    <NewConstructionProjectDialog action={createProjectAction} />
                </div>
                {items.length === 0 ? (
                    <p className={styles.empty}>
                        Nenhuma obra em “{categoriaValida.label}” ainda. Use “Nova obra” e marque
                        essa categoria.
                    </p>
                ) : (
                    <ConstructionProjectGrid
                        projects={items}
                        hasMore={hasMore}
                        moreHref={hasMore ? `${base}&offset=${nextOffset}` : undefined}
                    />
                )}
            </FinanceLayout>
        );
    }

    // Visão "Sem categoria": obras que ainda não têm categoria marcada.
    if (grupoParam === SEM_CATEGORIA) {
        const { items, hasMore } = await listProjectCards(
            session.user.id,
            { uncategorized: true },
            offset,
        );
        const nextOffset = offset + PROJECT_CARDS_PAGE_SIZE;

        const { uncategorized } = await countProjectsByCategory(session.user.id);

        return (
            <FinanceLayout current="construction">
                <nav aria-label="Trilha" className={styles.breadcrumb}>
                    <Link href="/finance/construction">Construção</Link>
                    <span aria-hidden="true">›</span>
                    <span aria-current="page">Sem categoria</span>
                </nav>
                <div className={styles.toolbar}>
                    <NewConstructionProjectDialog action={createProjectAction} />
                </div>
                <ConstructionGroupTabs
                    grupo="sem-categoria"
                    showUncategorized={uncategorized > 0}
                />
                {items.length === 0 ? (
                    <p className={styles.empty}>Nenhuma obra sem categoria.</p>
                ) : (
                    <ConstructionProjectGrid
                        projects={items}
                        hasMore={hasMore}
                        moreHref={
                            hasMore
                                ? `/finance/construction?grupo=${SEM_CATEGORIA}&offset=${nextOffset}`
                                : undefined
                        }
                    />
                )}
            </FinanceLayout>
        );
    }

    // Visão de grupo: cards das categorias (ou estado vazio do grupo).
    const grupo: ObraGrupoId = grupoValido?.id ?? "lavanderia";
    const { counts, uncategorized } = await countProjectsByCategory(session.user.id);
    const categorias = categoriasDoGrupo(grupo);

    return (
        <FinanceLayout current="construction">
            <div className={styles.toolbar}>
                <NewConstructionProjectDialog action={createProjectAction} />
            </div>

            <ConstructionGroupTabs grupo={grupo} showUncategorized={uncategorized > 0} />

            {categorias.length === 0 ? (
                <div className={styles.emptyState}>
                    <p className={styles.empty}>
                        Nenhuma categoria cadastrada neste grupo ainda. Use “Nova obra” e marque uma
                        categoria para organizar as obras aqui.
                    </p>
                    <NewConstructionProjectDialog action={createProjectAction} />
                </div>
            ) : (
                <ul className={styles.categoryGrid} aria-label="Categorias de obras">
                    {categorias.map((categoria) => {
                        const total = counts.get(categoria.id) ?? 0;
                        return (
                            <li key={categoria.id}>
                                <Link
                                    href={`/finance/construction?categoria=${categoria.id}`}
                                    className={styles.categoryCard}
                                >
                                    <span className={styles.categoryName}>{categoria.label}</span>
                                    <span className={styles.categoryCount}>
                                        {total === 0
                                            ? "Nenhuma obra"
                                            : total === 1
                                              ? "1 obra"
                                              : `${total} obras`}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </FinanceLayout>
    );
}
