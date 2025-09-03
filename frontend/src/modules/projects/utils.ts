import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { CustomFieldT, ProjectT } from "shared/model/types";

export const enum ProjectFormTabKey {
    GENERAL = "general",
    ACCESS = "access",
    CUSTOM_FIELDS = "customFields",
    WORKFLOWS = "workflows",
    LIST_VIEW = "listView",
    ENCRYPTION = "encryption",
}

export const useProjectViewTabs = (
    isAdmin: boolean,
    accessClaims: ProjectT["access_claims"],
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

        const canManagePermissions =
            isAdmin || accessClaims.includes("project:manage_permissions");
        const canUpdateProject =
            isAdmin || accessClaims.includes("project:update");

        if (canManagePermissions) {
            tabs.push({
                label: t("projects.sections.access"),
                value: ProjectFormTabKey.ACCESS,
            });
        }

        if (canUpdateProject) {
            tabs.push(
                ...[
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

        if (canUpdateProject && isProjectEncrypted) {
            tabs.push({
                label: t("projects.sections.encryption"),
                value: ProjectFormTabKey.ENCRYPTION,
            });
        }

        return tabs;
    }, [isAdmin, accessClaims, isProjectEncrypted, t]);
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
