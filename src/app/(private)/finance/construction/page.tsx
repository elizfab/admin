import type { Metadata } from "next";

import { createProjectAction } from "@/modules/construction/actions/project.actions";
import { ConstructionProjectGrid } from "@/modules/construction/components/ConstructionProjectGrid/ConstructionProjectGrid";
import { NewConstructionProjectDialog } from "@/modules/construction/components/NewConstructionProjectDialog/NewConstructionProjectDialog";
import { listProjects } from "@/modules/construction/server";
import { requireSession } from "@/lib/auth/session";
import { FinanceLayout } from "@/modules/finance/components/FinanceLayout/FinanceLayout";

import styles from "./page.module.scss";

export const metadata: Metadata = {
    title: "Construção",
};

export default async function ConstructionPage() {
    const session = await requireSession();
    const projects = await listProjects(session.user.id);

    return (
        <FinanceLayout
            current="construction"
            actions={<NewConstructionProjectDialog action={createProjectAction} />}
        >
            <section aria-labelledby="construction-title" className={styles.section}>
                <h2 id="construction-title" className={styles.sectionTitle}>
                    Construção
                </h2>
                <p className={styles.intro}>
                    Obras e reformas da casa (ex.: telhado, lavanderia), cada uma com fases,
                    serviços, compras e metas.
                </p>
                <ConstructionProjectGrid projects={projects} />
            </section>
        </FinanceLayout>
    );
}
