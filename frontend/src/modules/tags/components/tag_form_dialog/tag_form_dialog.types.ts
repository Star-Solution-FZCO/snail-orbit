import type { TagBaseT } from "types/tag";
import * as yup from "yup";

export const getTagFormSchema = () =>
    yup.object().shape({
        name: yup.string().required().default(""),
        description: yup.string().default(""),
        aiDescription: yup.string().default(""),
        color: yup.string().required().default("#fff"),
        untagOnResolve: yup.boolean().required().default(false),
        untagOnClose: yup.boolean().required().default(false),
    });

export type TagFormData = yup.InferType<ReturnType<typeof getTagFormSchema>>;

export type TagFormDialogProps = {
    open: boolean;
    onClose?: () => void;
    onSubmit?: (data: TagBaseT) => void;
    defaultValues?: TagBaseT;
    isLoading?: boolean;
};
