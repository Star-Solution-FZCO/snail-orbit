import { CommentT } from "types/comment.ts";
import { ProjectT } from "types/project.ts";

export type CreateIssueT = {
    project_id: string;
    subject: string;
    text: string | null;
};

export type IssueT = CreateIssueT & {
    id: string;
    project: Pick<ProjectT, "id" | "name" | "slug">;
    comments: Array<CommentT>;
};

export type UpdateIssueT = Partial<CreateIssueT>;
