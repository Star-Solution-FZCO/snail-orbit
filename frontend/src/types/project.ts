import { CustomFieldT } from "./custom_fields";
import { WorkflowT } from "./workflow";

export type CreateProjectT = {
    name: string;
    slug: string;
    description?: string;
    is_active?: boolean;
};

export type ProjectT = CreateProjectT & {
    id: string;
    description: string | null;
    is_active: boolean;
};

export type ProjectDetailT = ProjectT & {
    custom_fields: CustomFieldT[];
    workflows: WorkflowT[];
};

export type UpdateProjectT = Partial<CreateProjectT>;
