import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import type {
    CustomFieldValueT,
    CustomFieldWithValueT,
} from "shared/model/types";

export type IssueTemplateSearchParams = {
    project?: string;
    [key: string]: string | string[] | undefined;
};

export type IssueTemplateSource = {
    project?: { slug: string } | null;
    fields: Record<string, CustomFieldWithValueT>;
};

const fieldToTemplateValue = (
    field?: CustomFieldWithValueT,
): CustomFieldValueT => {
    if (!field) return null;

    switch (field.type) {
        case "user":
            return field.value?.email;
        case "user_multi":
            return field.value?.map((user) => user.email);
        case "enum":
        case "state":
        case "version":
        case "owned":
        case "sprint":
            return field.value?.value;
        case "enum_multi":
        case "version_multi":
        case "owned_multi":
        case "sprint_multi":
            return field.value?.map((el) => el.value);
        case "date":
        case "datetime":
        case "boolean":
        case "integer":
        case "float":
            return field.value;
        case "duration":
        case "string":
            return field.value?.toString();
        default:
            return null;
    }
};

const serializeFieldValue = (field: CustomFieldWithValueT): string | null => {
    const value = fieldToTemplateValue(field);

    if (value === null || value === undefined) {
        return null;
    }

    if (Array.isArray(value)) {
        return value.join(",");
    }

    if (typeof value === "boolean") {
        return value ? "true" : "false";
    }

    return String(value);
};

const deserializeFieldValue = (
    value: string,
    fieldType: CustomFieldWithValueT["type"],
): CustomFieldValueT => {
    switch (fieldType) {
        case "user_multi":
        case "enum_multi":
        case "version_multi":
        case "owned_multi":
        case "sprint_multi":
            return value.split(",").filter(Boolean);

        case "boolean":
            return value === "true";

        case "integer":
        case "duration": {
            const parsed = parseInt(value, 10);
            return isNaN(parsed) ? null : parsed;
        }

        case "float": {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? null : parsed;
        }

        case "user":
        case "enum":
        case "state":
        case "version":
        case "owned":
        case "sprint":
        case "date":
        case "datetime":
        case "string":
            return value;

        default:
            return value;
    }
};

export const useIssueTemplate = () => {
    const { t } = useTranslation();

    const generateTemplateUrl = useCallback(
        (source: IssueTemplateSource): string => {
            const params = new URLSearchParams();

            if (source.project?.slug) {
                params.set("project", source.project.slug);
            }

            Object.entries(source.fields).forEach(([fieldName, field]) => {
                const serializedValue = serializeFieldValue(field);
                if (serializedValue !== null) {
                    params.set(fieldName, serializedValue);
                }
            });

            const queryString = params.toString();
            const baseUrl = `${window.location.origin}/issues/create`;

            return queryString ? `${baseUrl}?${queryString}` : baseUrl;
        },
        [],
    );

    const parseTemplateParams = useCallback(
        (
            searchParams: IssueTemplateSearchParams,
        ): {
            projectSlug?: string;
            fields: Record<string, string>;
        } => {
            const { project, ...fields } = searchParams;

            const parsedFields: Record<string, string> = {};
            Object.entries(fields).forEach(([key, value]) => {
                if (value !== undefined) {
                    parsedFields[key] = Array.isArray(value)
                        ? value.join(",")
                        : value;
                }
            });

            return {
                projectSlug: project,
                fields: parsedFields,
            };
        },
        [],
    );

    const applyTemplateToFields = useCallback(
        (
            projectFields: CustomFieldWithValueT[],
            templateFields: Record<string, string>,
        ): Record<string, CustomFieldValueT> => {
            const result: Record<string, CustomFieldValueT> = {};

            projectFields.forEach((field) => {
                const templateValue = templateFields[field.name];

                if (templateValue !== undefined) {
                    try {
                        const deserializedValue = deserializeFieldValue(
                            templateValue,
                            field.type,
                        );

                        if (deserializedValue !== null) {
                            result[field.name] = deserializedValue;
                        }
                    } catch (error) {
                        console.warn(
                            `Failed to deserialize field ${field.name}:`,
                            error,
                        );
                    }
                }
            });

            return result;
        },
        [],
    );

    const copyTemplateUrlToClipboard = useCallback(
        async (url: string): Promise<boolean> => {
            try {
                await navigator.clipboard.writeText(url);
                return true;
            } catch (error) {
                console.error("Failed to copy to clipboard:", error);
                return false;
            }
        },
        [],
    );

    const copyTemplateUrl = useCallback(
        async (source: IssueTemplateSource): Promise<void> => {
            const url = generateTemplateUrl(source);
            const success = await copyTemplateUrlToClipboard(url);

            if (success) {
                toast.success(t("issues.template.urlCopied"));
            } else {
                toast.error(t("issues.template.copyFailed"));
            }
        },
        [generateTemplateUrl, copyTemplateUrlToClipboard, t],
    );

    return useMemo(
        () => ({
            generateTemplateUrl,
            parseTemplateParams,
            applyTemplateToFields,
            copyTemplateUrlToClipboard,
            copyTemplateUrl,
        }),
        [
            generateTemplateUrl,
            parseTemplateParams,
            applyTemplateToFields,
            copyTemplateUrlToClipboard,
            copyTemplateUrl,
        ],
    );
};
