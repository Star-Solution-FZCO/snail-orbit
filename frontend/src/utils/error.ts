import i18n from "i18n";
import { toast } from "react-toastify";

export const toastApiError = (error: any) => {
    const errorMessages = error?.error_messages || error?.data?.error_messages;
    toast.error(errorMessages?.join(". ") || i18n.t("error.default"));
};
