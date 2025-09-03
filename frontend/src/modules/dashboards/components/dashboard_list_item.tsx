import { Stack, Tooltip, Typography } from "@mui/material";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { DashboardT } from "shared/model/types";
import { Link, UserAvatar } from "shared/ui";

interface DashboardListItemProps {
    dashboard: DashboardT;
}

export const DashboardListItem: FC<DashboardListItemProps> = ({
    dashboard,
}) => {
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
                    to="/dashboards/$dashboardId"
                    params={{ dashboardId: dashboard.id }}
                    fontWeight="bold"
                >
                    {dashboard.name}
                </Link>

                <Tooltip
                    title={dashboard.description}
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
                        {dashboard.description || t("description.empty")}
                    </Typography>
                </Tooltip>
            </Stack>

            <Stack direction="row" alignItems="center" gap={1}>
                <UserAvatar src={dashboard.created_by.avatar} />

                <Typography variant="body2">
                    {dashboard.created_by.name}
                </Typography>
            </Stack>
        </Stack>
    );
};
