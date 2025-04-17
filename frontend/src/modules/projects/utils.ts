import { useMemo } from "react";
import { useTranslation } from "react-i18next";

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
