import type { TagBaseT } from "shared/model/types/tag";
import type { TagFormData } from "./tag_form_dialog.types";

export const tagToFormData = (data: TagBaseT): TagFormData => ({
    name: data.name,
    aiDescription: data.ai_description,
    color: data.color,
    description: data.description,
    untagOnClose: data.untag_on_close,
    untagOnResolve: data.untag_on_resolve,
});

export const formDataToTag = (data: TagFormData): TagBaseT => ({
    name: data.name,
    ai_description: data.aiDescription,
    untag_on_resolve: data.untagOnResolve,
    color: data.color,
    description: data.description,
    untag_on_close: data.untagOnClose,
});
