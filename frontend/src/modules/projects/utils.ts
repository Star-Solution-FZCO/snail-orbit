import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export const enum ProjectFormTabKey {
    GENERAL = "general",
    ACCESS = "access",
    CUSTOM_FIELDS = "customFields",
    WORKFLOWS = "workflows",
    LIST_VIEW = "listView",
}

export const useProjectFormTabs = () => {
    const { t, i18n } = useTranslation();

    return useMemo(
        () => [
            {
                label: t("projects.sections.generalInfo"),
                value: ProjectFormTabKey.GENERAL,
                adminOnly: false,
            },
            {
                label: t("projects.sections.access"),
                value: ProjectFormTabKey.ACCESS,
                adminOnly: true,
            },
            {
                label: t("projects.sections.customFields"),
                value: ProjectFormTabKey.CUSTOM_FIELDS,
                adminOnly: true,
            },
            {
                label: t("projects.sections.workflows"),
                value: ProjectFormTabKey.WORKFLOWS,
                adminOnly: true,
            },
            {
                label: t("projects.sections.listView"),
                value: ProjectFormTabKey.LIST_VIEW,
                adminOnly: true,
            },
        ],
        [t, i18n.language],
    );
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
