import { CustomFieldT } from "./custom_fields";

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
};

export type UpdateProjectT = Partial<CreateProjectT>;
