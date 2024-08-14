import { CommentT } from "types/comment.ts";
import { ProjectT } from "types/project.ts";

export type IssueT = {
    id: string;
    text: string;
    subtext: string;
    project: Pick<ProjectT, "id" | "name" | "slug">;
    comments: Array<CommentT>;
};

export type CreateIssueT = {
    project_id: string;
    subject: string;
    text?: string;
};

export type UpdateIssueT = {
    subject?: string;
    text?: string;
};
