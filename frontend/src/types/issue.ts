import { AttachmentT } from "./attachment";
import { CommentT } from "./comment";
import {
    BasicCustomFieldT,
    CustomFieldT,
    CustomFieldValueT,
} from "./custom_fields";
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

export type IssueProjectT = Pick<ProjectT, "id" | "name" | "slug">;

export type IssueT = {
    id: string;
    id_readable: string;
    project?: IssueProjectT;
    subject: string;
    text: string | null;
    fields: Record<string, CustomFieldT>;
    attachments: AttachmentT[];
    aliases: string[];
    is_subscribed: boolean;
    created_by: BasicUserT;
    created_at: string;
    updated_by: BasicUserT | null;
    updated_at: string | null;
};

export type UpdateIssueT = Partial<CreateIssueT>;

export type FieldValueChangeT = {
    field: BasicCustomFieldT | "subject" | "text";
    old_value: CustomFieldValueT;
    new_value: CustomFieldValueT;
};

export type IssueHistoryT = {
    id: string;
    author: BasicUserT;
    time: string;
    changes: FieldValueChangeT[];
};

export type IssueActivityTypeT = "comment" | "history";

export type IssueActivityT = {
    id: string;
    type: IssueActivityTypeT;
    time: string;
    data: CommentT | IssueHistoryT;
};
