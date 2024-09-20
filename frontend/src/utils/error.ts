import i18n from "i18n";
import { toast } from "react-toastify";

export const formatErrorMessages = (error: any) => {
    const errorData = error?.data;
    const errorFields: Record<string, string> | undefined =
        error?.error_fields || errorData?.error_fields;
    const errorMessages = error?.error_messages || errorData?.error_messages;

    const formattedErrorFields = errorFields
        ? Object.entries(errorFields)
              .map(([field, message]) => `${field}: ${message}`)
              .join(". ")
        : "";

    const formattedErrorMessages = errorMessages?.join(". ");

    return [formattedErrorMessages, formattedErrorFields]
        .filter(Boolean)
        .join(". ");
};

export const toastApiError = (error: any) => {
    toast.error(formatErrorMessages(error) || i18n.t("error.default"));
};
