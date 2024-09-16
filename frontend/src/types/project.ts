import { CustomFieldT } from "./custom_fields";
import { WorkflowT } from "./workflow";

export type BasicProjectT = {
    id: string;
    name: string;
    slug: string;
};

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

export type ProjectPermissionTargetT = {
    id: string;
    name: string;
};

export type TargetTypeT = "user" | "group";

export type TargetUserT = ProjectPermissionTargetT & { email: string };
export type TargetGroupT = ProjectPermissionTargetT & {
    description: string | null;
};

type RoleT = {
    id: string;
    name: string;
    description: string | null;
};

export type ProjectPermissionT = {
    id: string;
    target_type: TargetTypeT;
    target: TargetUserT | TargetGroupT;
    role: RoleT;
};
