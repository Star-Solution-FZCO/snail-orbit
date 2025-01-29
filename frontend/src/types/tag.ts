import type { BasicUserT } from "./user";

export type TagBaseT = {
    name: string;
    description: string;
    ai_description: string;
    color: string;
    untag_on_resolve: boolean;
    untag_on_close: boolean;
};

export type TagT = {
    id: string;
    created_by: BasicUserT;
} & TagBaseT;
