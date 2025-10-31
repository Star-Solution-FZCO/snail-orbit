import { Stack, Tooltip, Typography } from "@mui/material";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { ReportT } from "shared/model/types/report";
import { Link, UserAvatar } from "shared/ui";

interface ReportListItemProps {
    report: ReportT;
}

export const ReportListItem: FC<ReportListItemProps> = ({ report }) => {
    const { t } = useTranslation();

    return (
        <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={1}
        >
            <Stack overflow="hidden">
                <Link
                    to="/reports/$reportId"
                    params={{ reportId: report.id }}
                    fontWeight="bold"
                >
                    {report.name}
                </Link>

                <Tooltip
                    title={report.description}
                    placement="top"
                    enterDelay={1000}
                    disableInteractive
                    arrow
                >
                    <Typography
                        variant="subtitle2"
                        color="textSecondary"
                        sx={{
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {report.description || t("description.empty")}
                    </Typography>
                </Tooltip>
            </Stack>

            <Stack direction="row" alignItems="center" gap={1}>
                <UserAvatar
                    src={report.created_by.avatar}
                    isBot={report.created_by.is_bot}
                />

                <Typography variant="body2">
                    {report.created_by.name}
                </Typography>
            </Stack>
        </Stack>
    );
};
