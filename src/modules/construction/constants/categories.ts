/**
 * Catálogo ÚNICO de grupos e categorias de obras (ETAPA 02/03 — Construção).
 *
 * O select do modal "Nova obra", a grade de cards, os sub-abas e a validação
 * do backend leem SOMENTE daqui: para adicionar uma categoria, inclua uma linha.
 * O grupo de uma obra é DERIVADO das categorias dela — não é salvo no banco.
 */

export const OBRA_GRUPOS = [
    { id: "lavanderia", label: "Lavanderia" },
    { id: "residencia", label: "Residência" },
] as const;

export type ObraGrupoId = (typeof OBRA_GRUPOS)[number]["id"];

export const OBRA_CATEGORIAS = [
    {
        id: "lavanderia",
        label: "Lavanderia",
        shortLabel: "Lavanderia",
        grupoId: "lavanderia",
    },
    {
        id: "escritorio-lavanderia",
        label: "Escritório da Lavanderia",
        shortLabel: "Escritório",
        grupoId: "lavanderia",
    },
    {
        id: "banheiro-lavanderia",
        label: "Banheiro da Lavanderia",
        shortLabel: "Banheiro",
        grupoId: "lavanderia",
    },
] as const;

export type ObraCategoriaId = (typeof OBRA_CATEGORIAS)[number]["id"];

export const obraCategoriaIds = OBRA_CATEGORIAS.map((c) => c.id) as [
    ObraCategoriaId,
    ...ObraCategoriaId[],
];

export const obraCategorias = OBRA_CATEGORIAS;

/** Categorias de um grupo, na ordem do catálogo. */
export function categoriasDoGrupo(grupoId: ObraGrupoId) {
    return OBRA_CATEGORIAS.filter((categoria) => categoria.grupoId === grupoId);
}

/** Grupo da categoria (para breadcrumb e derivação). */
export function grupoDaCategoria(categoriaId: string) {
    const categoria = OBRA_CATEGORIAS.find((c) => c.id === categoriaId);
    return categoria ? OBRA_GRUPOS.find((g) => g.id === categoria.grupoId) : undefined;
}

/** Rótulo da categoria pelo id (dado desconhecido não quebra a tela). */
export function categoriaLabel(categoriaId: string) {
    return OBRA_CATEGORIAS.find((c) => c.id === categoriaId)?.label ?? categoriaId;
}

/** Grupos que uma obra toca, a partir dos categoryIds salvos. */
export function gruposDaObra(categoryIds: string[]) {
    const ids = new Set(categoryIds);
    return OBRA_GRUPOS.filter((grupo) =>
        OBRA_CATEGORIAS.some((c) => c.grupoId === grupo.id && ids.has(c.id)),
    );
}
