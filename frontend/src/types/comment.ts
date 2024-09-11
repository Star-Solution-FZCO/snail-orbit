import { BasicUserT } from "./user";

export type CreateCommentT = {
    text: string | null;
    attachments?: string[];
};

export type UpdateCommentT = Partial<CreateCommentT>;

export type CommentT = {
    id: string;
    text: string | null;
    author: BasicUserT;
    created_at: string;
    updated_at: string;
    attachments: string[];
};
