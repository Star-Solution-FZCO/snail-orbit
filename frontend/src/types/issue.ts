import { CommentT } from "./comment";
import { CustomFieldTypeT } from "./custom_fields";
import { ProjectT } from "./project";

export type CreateIssueT = {
    project_id: string;
    subject: string;
    text: string | null;
    fields: Record<
        string,
        { id: string; type: CustomFieldTypeT; value: string }
    >;
};

export type IssueT = {
    id: string;
    project: Pick<ProjectT, "id" | "name" | "slug">;
    comments: Array<CommentT>;
    subject: string;
    text: string | null;
    fields: Record<
        string,
        { id: string; type: CustomFieldTypeT; value: string }
    >;
};

export type UpdateIssueT = Partial<CreateIssueT>;
