import CloseIcon from "@mui/icons-material/Close";
import { TabContext, TabList } from "@mui/lab";
import {
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Tab,
} from "@mui/material";
import { useState, type FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { dashboardApi } from "shared/model";
import { DashboardT } from "shared/model/types";
import { TabPanel } from "shared/ui";
import { toastApiError } from "shared/utils";
import { DashboardAccess } from "./dashboard_access";
import { DashboardForm } from "./dashboard_form";
import { DeleteDashboardDialog } from "./delete_dashboard_dialog";

interface DashboardSettingsDialogProps {
    dashboard: DashboardT;
    open: boolean;
    onClose: () => void;
}

export const DashboardSettingsDialog: FC<DashboardSettingsDialogProps> = ({
    dashboard,
    open,
    onClose,
}) => {
    const { t } = useTranslation();

    const [currentTab, setCurrentTab] = useState("general");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [updateDashboard, { isLoading: isUpdating }] =
        dashboardApi.useUpdateDashboardMutation();

    const handleChangeTab = (_: React.SyntheticEvent, value: string) => {
        setCurrentTab(value);
    };

    const handleSubmit = (formData: {
        name: string;
        description: string | null;
    }) => {
        updateDashboard({ id: dashboard.id, ...formData })
            .unwrap()
            .then(() => {
                toast.success(t("dashboards.update.success"));
            })
            .catch(toastApiError);
    };

    const canManageAccess = dashboard.current_permission === "admin";

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                {t("dashboards.settings.title", { name: dashboard.name })}

                <IconButton
                    onClick={onClose}
                    size="small"
                    disabled={isUpdating}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    height: 1,
                    overflow: "hidden",
                }}
            >
                <TabContext value={currentTab}>
                    <Box borderBottom={1} borderColor="divider" mb={2}>
                        <TabList onChange={handleChangeTab}>
                            <Tab
                                label={t("dashboards.sections.general")}
                                value="general"
                            />

                            {canManageAccess && (
                                <Tab
                                    label={t("dashboards.sections.access")}
                                    value="access"
                                />
                            )}
                        </TabList>
                    </Box>

                    <TabPanel value="general">
                        <DashboardForm
                            defaultValues={dashboard}
                            onSubmit={handleSubmit}
                            onDelete={() => setDeleteDialogOpen(true)}
                            loading={isUpdating}
                        />
                    </TabPanel>

                    {canManageAccess && (
                        <TabPanel value="access">
                            <DashboardAccess dashboard={dashboard} />
                        </TabPanel>
                    )}
                </TabContext>
            </DialogContent>

            <DeleteDashboardDialog
                dashboard={dashboard}
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            />
        </Dialog>
    );
};
