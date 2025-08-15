import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export const useProfilePageTabs = () => {
    const { t } = useTranslation();

    return useMemo(
        () => [
            { value: "api_tokens", label: t("profile.sections.apiTokens") },
            { value: "security", label: t("profile.sections.security") },
            { value: "workspace", label: t("profile.sections.workspace") },
            { value: "tags", label: t("profile.sections.tags") },
            { value: "keys", label: t("profile.sections.keys") },
        ],
        [t],
    );
};
