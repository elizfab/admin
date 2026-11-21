export type ConstructionProjectCard = {
    id: string;
    name: string;
    startDate: Date | null;
    plannedEndDate: Date | null;
    categoryIds?: string[];
};

export type ConstructionProjectGridProps = {
    projects: ConstructionProjectCard[];
    /** Há próxima página ("Ver mais" só existe quando verdadeiro — OBRA-R18). */
    hasMore?: boolean;
    /** Destino do "Ver mais" (offset da próxima página). */
    moreHref?: string;
};
