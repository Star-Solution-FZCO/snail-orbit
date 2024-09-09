import i18n from "i18n";
import { toast } from "react-toastify";

export const formatErrorMessages = (error: any) => {
    const errorMessages = error?.error_messages || error?.data?.error_messages;
    return errorMessages?.join(". ");
};

export const toastApiError = (error: any) => {
    toast.error(formatErrorMessages(error) || i18n.t("error.default"));
};
