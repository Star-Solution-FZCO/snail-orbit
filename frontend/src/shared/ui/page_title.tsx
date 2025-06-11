import { ENVIRONMENT } from "app/config";
import type { FC } from "react";

export const PageTitle: FC<{ title: string }> = ({ title }) => {
    const pageTitle =
        ENVIRONMENT === "prod" ? title : `[${ENVIRONMENT}] ${title}`;

    return <title>{pageTitle}</title>;
};
