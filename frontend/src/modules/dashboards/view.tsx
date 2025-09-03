import { Stack } from "@mui/material";
import { FC, useEffect, useState } from "react";
import { dashboardApi } from "shared/model";
import { ErrorHandler } from "shared/ui";
import { toastApiError } from "shared/utils";
import { saveToLS } from "shared/utils/helpers/local-storage";
import { DashboardSkeleton } from "./components/dashboard_skeleton";
import { DashboardTopBar } from "./components/dashboard_top_bar";
import { DashboardWidgets } from "./components/dashboard_widgets";
import {
    DashboardWidgetFormData,
    WidgetFormDialog,
} from "./widgets/widget_form_dialog";

interface DashboardViewProps {
    dashboardId: string;
}

export const DashboardView: FC<DashboardViewProps> = ({ dashboardId }) => {
    const [addWidgetDialogOpen, setAddWidgetDialogOpen] = useState(false);

    const { data, isLoading, isFetching, error } =
        dashboardApi.useGetDashboardQuery(dashboardId);

    const [addWidget, { isLoading: isAdding }] =
        dashboardApi.useCreateDashboardTileMutation();

    const handleSubmitAddWidget = (formData: DashboardWidgetFormData) => {
        addWidget({
            id: dashboardId,
            body: {
                type: formData.type.type,
                name: formData.name,
                query: formData.query,
                ui_settings: {
                    height: formData.height,
                },
            },
        })
            .unwrap()
            .then(() => {
                setAddWidgetDialogOpen(false);
            })
            .catch(toastApiError);
    };

    useEffect(() => {
        saveToLS("LAST_VIEW_DASHBOARD", dashboardId);
    }, [dashboardId]);

    if (isLoading) return <DashboardSkeleton />;

    if (error) {
        return (
            <ErrorHandler error={error} message="dashboards.item.fetch.error" />
        );
    }

    if (!data) return null;

    const dashboard = data.payload;

    return (
        <Stack px={4} pb={4} height={1} gap={1}>
            <DashboardTopBar
                dashboard={dashboard}
                onAddWidget={() => setAddWidgetDialogOpen(true)}
            />

            <DashboardWidgets
                dashboard={dashboard}
                onAddWidget={() => setAddWidgetDialogOpen(true)}
                loading={isFetching}
            />

            <WidgetFormDialog
                open={addWidgetDialogOpen}
                onClose={() => setAddWidgetDialogOpen(false)}
                onSubmit={handleSubmitAddWidget}
                loading={isAdding}
            />
        </Stack>
    );
};
