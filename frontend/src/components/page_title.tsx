import type { FC } from "react";
import { Helmet } from "react-helmet-async";

export const PageTitle: FC<{ title: string }> = ({ title }) => {
    return (
        <Helmet>
            <title>{title}</title>
        </Helmet>
    );
};
