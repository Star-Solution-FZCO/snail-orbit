import { Stack } from "@mui/material";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { WidgetBase } from "./base";
import type { WidgetProps } from "./types";

type ReportWidgetProps = WidgetProps;

export const ReportWidget: FC<ReportWidgetProps> = (props) => {
    const { t } = useTranslation();

    return (
        <WidgetBase {...props}>
            <Stack overflow="auto" px={2} pb={1}></Stack>
        </WidgetBase>
    );
};
