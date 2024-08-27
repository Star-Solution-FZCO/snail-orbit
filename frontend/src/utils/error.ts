import i18n from "i18n";
import { toast } from "react-toastify";

export const toastApiError = (error: any) => {
    toast.error(
        error?.data?.error_messages?.join(". ") || i18n.t("error.default"),
    );
};
