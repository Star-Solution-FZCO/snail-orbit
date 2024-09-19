import { CustomFieldT } from "./custom_fields";
import { ProjectT } from "./project";
import { BasicUserT } from "./user";

// TODO: specify type
export type FieldValueT = string | number | boolean | null | string[];

export type CreateIssueT = {
    project_id: string;
    subject: string;
    text: string | null;
    fields: Record<string, FieldValueT>;
    attachments?: string[];
};

export type IssueAttachmentT = {
    id: string;
    name: string;
    size: number;
    content_type: string;
    author: BasicUserT;
    created_at: string;
    ocr_text: string | null;
};

export type IssueT = {
    id: string;
    id_readable: string;
    project: Pick<ProjectT, "id" | "name" | "slug">;
    subject: string;
    text: string | null;
    fields: Record<string, CustomFieldT>;
    attachments: IssueAttachmentT[];
    aliases: string[];
    is_subscribed: boolean;
};

export type UpdateIssueT = Partial<CreateIssueT>;
