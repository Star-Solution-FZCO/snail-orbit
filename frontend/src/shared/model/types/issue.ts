import type { AttachmentT } from "./attachment";
import type { CommentT } from "./comment";
import type {
    BasicCustomFieldT,
    CustomFieldT,
    CustomFieldValueT,
} from "./custom_fields";
import type { ProjectT } from "./project";
import type { TagShortT } from "./tag";
import type { BasicUserT } from "./user";

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
    is_resolved: boolean;
    is_closed: boolean;
    is_subscribed: boolean;
    tags: TagShortT[];
    created_by: BasicUserT;
    created_at: string;
    updated_by: BasicUserT | null;
    updated_at: string | null;
    resolved_at: string | null;
    closed_at: string | null;
    interlinks: IssueLinkT[];
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

export type IssueActivityTypeT = "comment" | "spent_time" | "history";

export type IssueLinkFieldT = Pick<
    IssueT,
    "id" | "aliases" | "subject" | "id_readable" | "is_resolved" | "is_closed"
>;

export const linkTypes = [
    "related",
    "required_for",
    "depends_on",
    "duplicated_by",
    "duplicates",
    "subtask_of",
    "parent_of",
    "blocks",
    "blocked_by",
    "clones",
    "cloned_by",
] as const;

export type IssueLinkTypeT = (typeof linkTypes)[number];

export type IssueLinkT = {
    id: string;
    issue: IssueLinkFieldT;
    type: IssueLinkTypeT;
};

export type IssueSpentTimeRecordT = {
    id: string;
    user: BasicUserT;
    spent_time: number;
    created_at: string;
};

export type IssueSpentTimeT = {
    total_spent_time: number;
    records: IssueSpentTimeRecordT[];
};

export type IssueFeedRecordT = {
    type: "comment" | "history";
    data: CommentT | IssueHistoryT;
    time: string;
};
