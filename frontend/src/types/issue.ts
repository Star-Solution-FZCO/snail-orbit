import { CommentT } from "./comment";
import { CustomFieldT, IssueValueT } from "./custom_fields";
import { ProjectT } from "./project";

export type CreateIssueT = {
    project_id: string;
    subject: string;
    text: string | null;
    fields: Record<string, IssueValueT>;
};

export type IssueT = {
    id: string;
    project: Pick<ProjectT, "id" | "name" | "slug">;
    comments: Array<CommentT>;
    subject: string;
    text: string | null;
    fields: Record<string, CustomFieldT>;
};

export type UpdateIssueT = Partial<CreateIssueT>;
