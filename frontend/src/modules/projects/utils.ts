import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CustomFieldT } from "shared/model/types";

export const enum ProjectFormTabKey {
    GENERAL = "general",
    ACCESS = "access",
    CUSTOM_FIELDS = "customFields",
    WORKFLOWS = "workflows",
    LIST_VIEW = "listView",
    ENCRYPTION = "encryption",
}

export const useProjectFormTabs = (
    isAdmin: boolean,
    isProjectEncrypted: boolean,
) => {
    const { t } = useTranslation();

    return useMemo(() => {
        const tabs = [
            {
                label: t("projects.sections.generalInfo"),
                value: ProjectFormTabKey.GENERAL,
            },
        ];

        if (isAdmin) {
            tabs.push(
                ...[
                    {
                        label: t("projects.sections.access"),
                        value: ProjectFormTabKey.ACCESS,
                    },
                    {
                        label: t("projects.sections.customFields"),
                        value: ProjectFormTabKey.CUSTOM_FIELDS,
                    },
                    {
                        label: t("projects.sections.workflows"),
                        value: ProjectFormTabKey.WORKFLOWS,
                    },
                    {
                        label: t("projects.sections.listView"),
                        value: ProjectFormTabKey.LIST_VIEW,
                    },
                ],
            );
        }

        if (isAdmin && isProjectEncrypted) {
            tabs.push({
                label: t("projects.sections.encryption"),
                value: ProjectFormTabKey.ENCRYPTION,
            });
        }

        return tabs;
    }, [isAdmin, isProjectEncrypted, t]);
};

export const generateSlug = (name: string): string => {
    if (!name) return "";

    const words = name.split(/\s+/).filter(Boolean);
    if (words.length === 1) {
        return words[0].toUpperCase();
    }

    let slug = "";

    for (const word of words) {
        const capitals = word.match(/[A-Z0-9]/g);

        if (capitals) {
            slug += capitals.join("");
        } else {
            slug += word[0].toUpperCase();
        }
    }

    return slug;
};

export const groupCustomFields = (
    fields: CustomFieldT[],
): Array<{
    gid: string;
    name: string;
    fields: CustomFieldT[];
}> => {
    const groups = new Map<string, CustomFieldT[]>();

    for (const field of fields) {
        if (!groups.has(field.gid)) {
            groups.set(field.gid, []);
        }
        groups.get(field.gid)!.push(field);
    }

    return Array.from(groups.entries()).map(([gid, groupFields]) => ({
        gid,
        fields: groupFields,
        name: groupFields[0]?.name || "",
    }));
};
