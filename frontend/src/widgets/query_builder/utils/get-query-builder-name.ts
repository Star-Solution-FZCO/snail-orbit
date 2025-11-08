import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export const useGetQueryBuilderFilterName = () => {
    const { t } = useTranslation();

    return useCallback(
        (name: string) => {
            if (name === "updated_by") return t("Updated by");
            if (name === "created_by") return t("Created by");
            if (name === "updated_at") return t("Updated at");
            if (name === "created_at") return t("Created at");
            if (name === "project") return t("Project");
            if (name === "tag") return t("Tag");
            if (name === "#closed") return t("#Closed");
            if (name === "#open") return t("#Open");
            if (name === "#resolved") return t("#Resolved");
            if (name === "#unresolved") return t("#Unresolved");
            if (name === "id") return t("Id");
            if (name === "subject") return t("Subject");
            if (name === "text") return t("Text");
            return name;
        },
        [t],
    );
};
