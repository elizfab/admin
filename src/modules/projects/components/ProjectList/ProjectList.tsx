import { ExternalLink, Pencil } from "lucide-react";
import Link from "next/link";

import { buttonClassName } from "@/components/ui/Button/Button";
import { cn } from "@/lib/utils/cn";

import { projectStatusLabel, type Project } from "../../types/project.types";
import { DeleteProjectButton } from "../DeleteProjectButton/DeleteProjectButton";
import styles from "./ProjectList.module.scss";

type ProjectListProps = {
    projects: Project[];
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo",
});

export function ProjectList({ projects }: ProjectListProps) {
    return (
        <ul className={styles.list}>
            {projects.map((project) => (
                <li key={project.id} className={styles.item}>
                    <div className={styles.info}>
                        <div className={styles.titleRow}>
                            <h2 className={styles.name}>{project.name}</h2>
                            <span className={cn(styles.status, styles[`status_${project.status}`])}>
                                {projectStatusLabel[project.status]}
                            </span>
                        </div>

                        {project.description && <p className={styles.description}>{project.description}</p>}

                        <p className={styles.meta}>
                            Atualizado em {dateFormatter.format(project.updatedAt)}
                            {project.repositoryUrl && (
                                <>
                                    {" · "}
                                    <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">
                                        Repositório <ExternalLink size={12} aria-hidden="true" />
                                        <span className="visually-hidden"> (abre em nova aba)</span>
                                    </a>
                                </>
                            )}
                        </p>
                    </div>

                    <div className={styles.actions}>
                        <Link
                            href={`/projects/${project.id}/edit`}
                            className={buttonClassName("secondary")}
                            aria-label={`Editar o projeto ${project.name}`}
                        >
                            <Pencil size={16} aria-hidden="true" />
                        </Link>
                        <DeleteProjectButton projectId={project.id} projectName={project.name} />
                    </div>
                </li>
            ))}
        </ul>
    );
}
