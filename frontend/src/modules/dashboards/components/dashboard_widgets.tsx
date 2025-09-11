import { Button, Skeleton, Stack, Typography } from "@mui/material";
import type { FC } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { dashboardApi } from "shared/model";
import type { DashboardT, DashboardTileT } from "shared/model/types";
import { toastApiError } from "shared/utils";
import type { DashboardWidgetFormData } from "../widgets/widget_form_dialog";
import { WidgetFormDialog } from "../widgets/widget_form_dialog";
import { WidgetRenderer } from "../widgets/widget_renderer";
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

    const [createWidget] = dashboardApi.useCreateDashboardTileMutation();
    const [updateWidget, { isLoading: isUpdating }] =
        dashboardApi.useUpdateDashboardTileMutation();
    const [deleteWidget, { isLoading: isDeleting }] =
        dashboardApi.useDeleteDashboardTileMutation();

    // temporary mansory layout algorithm
    const columns = useMemo(() => {
        const leftColumn: DashboardTileT[] = [];
        const rightColumn: DashboardTileT[] = [];
        let leftHeight = 0;
        let rightHeight = 0;

        widgets.forEach((widget) => {
            const widgetHeight = (widget.ui_settings?.height as number) || 160;

            if (leftHeight <= rightHeight) {
                leftColumn.push(widget);
                leftHeight += widgetHeight;
            } else {
                rightColumn.push(widget);
                rightHeight += widgetHeight;
            }
        });

        return { leftColumn, rightColumn };
    }, [widgets]);

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
                    polling_interval: formData.polling_interval,
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

    const handleClickCloneWidget = (widget: DashboardTileT) => {
        createWidget({
            id: dashboard.id,
            body: {
                name: `${widget.name} (Copy)`,
                type: widget.type,
                query: widget.query,
                ui_settings: widget.ui_settings,
            },
        })
            .unwrap()
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
            <Stack direction="row" gap={2} alignItems="start">
                <Stack flex={1} gap={2}>
                    {[200, 300].map((height, index) => (
                        <Skeleton
                            key={index}
                            variant="rounded"
                            sx={{ height }}
                        />
                    ))}
                </Stack>
                <Stack flex={1} gap={2}>
                    {[250, 350].map((height, index) => (
                        <Skeleton
                            key={index}
                            variant="rounded"
                            sx={{ height }}
                        />
                    ))}
                </Stack>
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
        <Stack direction="row" gap={2} alignItems="start">
            <Stack flex={1} gap={2}>
                {columns.leftColumn.map((widget) => (
                    <WidgetRenderer
                        key={widget.id}
                        widget={widget}
                        onEdit={handleClickEditWidget}
                        onClone={handleClickCloneWidget}
                        onDelete={handleClickDeleteWidget}
                        canManage={canManageWidgets}
                    />
                ))}
            </Stack>

            <Stack flex={1} gap={2}>
                {columns.rightColumn.map((widget) => (
                    <WidgetRenderer
                        key={widget.id}
                        widget={widget}
                        onEdit={handleClickEditWidget}
                        onClone={handleClickCloneWidget}
                        onDelete={handleClickDeleteWidget}
                        canManage={canManageWidgets}
                    />
                ))}
            </Stack>

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
