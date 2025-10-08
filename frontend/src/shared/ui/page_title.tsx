import { APP_TITLE_PREFIX } from "app/config";
import type { FC } from "react";

export const PageTitle: FC<{ title: string }> = ({ title }) => {
    const pageTitle = APP_TITLE_PREFIX
        ? `[${APP_TITLE_PREFIX}] ${title}`
        : title;

    return <title>{pageTitle}</title>;
};
