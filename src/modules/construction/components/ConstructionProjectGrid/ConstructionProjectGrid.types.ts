export type ConstructionProjectCard = {
    id: string;
    name: string;
    startDate: Date | null;
    plannedEndDate: Date | null;
};

export type ConstructionProjectGridProps = {
    projects: ConstructionProjectCard[];
};
