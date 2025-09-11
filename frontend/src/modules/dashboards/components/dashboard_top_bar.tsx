import AddIcon from "@mui/icons-material/Add";
import SettingsIcon from "@mui/icons-material/Settings";
import { Button, IconButton, Stack } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { DashboardT } from "shared/model/types";
import { Link } from "shared/ui";
import { canEdit } from "shared/utils/permissions/checks";
import { DashboardSelect } from "./dashboard_select";
import { DashboardSettingsDialog } from "./dashboard_settings_dialog";

interface DashboardTopBarProps {
    dashboard: DashboardT;
    onAddWidget: () => void;
}

export const DashboardTopBar: FC<DashboardTopBarProps> = ({
    dashboard,
    onAddWidget,
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

    const handleChangeDashboard = (dashboard: DashboardT) => {
        navigate({
            to: "/dashboards/$dashboardId",
            params: { dashboardId: dashboard.id },
        });
    };

    const isCanEdit = canEdit(dashboard.current_permission);

    return (
        <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            gap={1}
        >
            <Stack direction="row" alignItems="center" gap={1}>
                <DashboardSelect
                    value={dashboard}
                    onChange={handleChangeDashboard}
                />

                {isCanEdit && (
                    <IconButton
                        onClick={() => setSettingsDialogOpen(true)}
                        color="primary"
                    >
                        <SettingsIcon />
                    </IconButton>
                )}
            </Stack>

            <Stack direction="row" alignItems="center" gap={1}>
                <Link to="/dashboards/create">
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                    >
                        {t("dashboards.new")}
                    </Button>
                </Link>

                {isCanEdit && (
                    <Button
                        onClick={onAddWidget}
                        size="small"
                        variant="outlined"
                        color="secondary"
                    >
                        {t("dashboards.widgets.add")}
                    </Button>
                )}
            </Stack>

            <DashboardSettingsDialog
                dashboard={dashboard}
                open={settingsDialogOpen}
                onClose={() => setSettingsDialogOpen(false)}
            />
        </Stack>
    );
};
