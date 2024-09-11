import { CommentT } from "./comment";
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
    project: Pick<ProjectT, "id" | "name" | "slug">;
    comments: Array<CommentT>;
    subject: string;
    text: string | null;
    fields: Record<string, CustomFieldT>;
    attachments: string[];
};

export type UpdateIssueT = Partial<CreateIssueT>;
