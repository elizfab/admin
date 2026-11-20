import type { FormState } from "../../actions/project.actions";

export type NewConstructionProjectDialogProps = {
    /** Action de criar obra (createProjectAction): ao salvar, vai para a configuração da obra. */
    action: (state: FormState, formData: FormData) => Promise<FormState>;
};
