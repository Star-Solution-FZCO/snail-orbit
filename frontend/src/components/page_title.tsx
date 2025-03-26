import type { FC } from "react";

export const PageTitle: FC<{ title: string }> = ({ title }) => {
    return <title>{title}</title>;
};
