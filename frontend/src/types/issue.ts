import { CustomFieldT } from "./custom_fields";
import { ProjectT } from "./project";

// TODO: specify type
export type FieldValueT = string | number | boolean | null | string[];

export type CreateIssueT = {
    project_id: string;
    subject: string;
    text: string | null;
    fields: Record<string, FieldValueT>;
    attachments?: string[];
};

export type IssueT = {
    id: string;
    id_readable: string | null;
    project: Pick<ProjectT, "id" | "name" | "slug">;
    subject: string;
    text: string | null;
    fields: Record<string, CustomFieldT>;
    attachments: string[];
    aliases: string[];
};

export type UpdateIssueT = Partial<CreateIssueT>;
