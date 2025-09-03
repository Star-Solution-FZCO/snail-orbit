import { Button, Skeleton, Stack, Typography } from "@mui/material";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { dashboardApi } from "shared/model";
import { DashboardT, DashboardTileT } from "shared/model/types";
import { toastApiError } from "shared/utils";
import { IssueListWidget } from "../widgets/issue_list_widget";
import {
    DashboardWidgetFormData,
    WidgetFormDialog,
} from "../widgets/widget_form_dialog";
import { DeleteWidgetDialog } from "./delete_widget_dialog";

interface DashboardWidgetsProps {
    dashboard: DashboardT;
    onAddWidget: () => void;
    loading?: boolean;
}

export const DashboardWidgets: FC<DashboardWidgetsProps> = ({
    dashboard,
    onAddWidget,
    loading = false,
}) => {
    const { t } = useTranslation();

    const { tiles: widgets } = dashboard;

    const [editWidgetDialogOpen, setEditWidgetDialogOpen] = useState(false);
    const [deleteWidgetDialogOpen, setDeleteWidgetDialogOpen] = useState(false);
    const [selectedWidget, setSelectedWidget] = useState<DashboardTileT | null>(
        null,
    );

    const [updateWidget, { isLoading: isUpdating }] =
        dashboardApi.useUpdateDashboardTileMutation();
    const [deleteWidget, { isLoading: isDeleting }] =
        dashboardApi.useDeleteDashboardTileMutation();

    const handleClickEditWidget = (widget: DashboardTileT) => {
        setSelectedWidget(widget);
        setEditWidgetDialogOpen(true);
    };

    const handleCloseEditWidget = () => {
        setEditWidgetDialogOpen(false);
        setSelectedWidget(null);
    };

    const handleClickDeleteWidget = (widget: DashboardTileT) => {
        setSelectedWidget(widget);
        setDeleteWidgetDialogOpen(true);
    };

    const handleCloseDeleteWidget = () => {
        setDeleteWidgetDialogOpen(false);
        setSelectedWidget(null);
    };

    const handleSubmitEditWidget = (formData: DashboardWidgetFormData) => {
        if (!selectedWidget) return;

        updateWidget({
            dashboardId: dashboard.id,
            id: selectedWidget.id,
            body: {
                name: formData.name,
                query: formData.query,
                ui_settings: {
                    height: formData.height,
                },
            },
        })
            .unwrap()
            .then(() => {
                setEditWidgetDialogOpen(false);
                setSelectedWidget(null);
            })
            .catch(toastApiError);
    };

    const handleDeleteWidget = () => {
        if (!selectedWidget) return;

        deleteWidget({ dashboardId: dashboard.id, id: selectedWidget.id })
            .unwrap()
            .then(() => {
                setDeleteWidgetDialogOpen(false);
                setSelectedWidget(null);
            })
            .catch(toastApiError);
    };

    const canManageWidgets =
        dashboard.current_permission === "edit" ||
        dashboard.current_permission === "admin";

    if (loading)
        return (
            <Stack flexWrap="wrap" gap={2} flex={1}>
                {Array.from({ length: 2 }).map((_, rowIndex) => (
                    <Stack key={rowIndex} direction="row" gap={2} flex={1}>
                        {Array.from({ length: 2 }).map((_, colIndex) => (
                            <Skeleton
                                key={colIndex}
                                variant="rounded"
                                sx={{
                                    flex: 1,
                                    height: 1,
                                }}
                            />
                        ))}
                    </Stack>
                ))}
            </Stack>
        );

    if (widgets.length === 0) {
        return (
            <Stack flex={1} alignItems="center" justifyContent="center">
                <Stack
                    maxWidth={400}
                    alignItems="center"
                    textAlign="center"
                    gap={2}
                >
                    <Typography variant="h5" fontWeight="bold">
                        {t("dashboards.empty.title")}
                    </Typography>
                    <Typography variant="body1">
                        {t("dashboards.empty.hint")}
                    </Typography>

                    {canManageWidgets && (
                        <Button onClick={onAddWidget} variant="outlined">
                            {t("dashboards.widgets.add")}
                        </Button>
                    )}
                </Stack>
            </Stack>
        );
    }

    return (
        <Stack direction="row" flexWrap="wrap" gap={2}>
            {widgets.map((widget) => (
                <IssueListWidget
                    key={widget.id}
                    widget={widget}
                    onEdit={handleClickEditWidget}
                    onDelete={handleClickDeleteWidget}
                    canManage={canManageWidgets}
                />
            ))}

            <WidgetFormDialog
                defaultValues={selectedWidget}
                open={editWidgetDialogOpen}
                onClose={handleCloseEditWidget}
                onSubmit={handleSubmitEditWidget}
                loading={isUpdating}
            />

            <DeleteWidgetDialog
                open={deleteWidgetDialogOpen}
                onClose={handleCloseDeleteWidget}
                onDelete={handleDeleteWidget}
                loading={isDeleting}
            />
        </Stack>
    );
};
