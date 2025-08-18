import type { BasicUserT } from "./user";

export type AttachmentT = {
    id: string;
    name: string;
    size: number;
    content_type: string;
    author: BasicUserT;
    created_at: string;
    ocr_text: string | null;
    url: string;
};

export type SelectedAttachmentT = {
    id: string | number;
    filename: string;
};
