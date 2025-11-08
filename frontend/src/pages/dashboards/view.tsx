import { Divider, Stack } from "@mui/material";
import { DashboardSkeleton } from "modules/dashboards/components/dashboard_skeleton";
import { DashboardTopBar } from "modules/dashboards/components/dashboard_top_bar";
import { DashboardWidgets } from "modules/dashboards/components/dashboard_widgets";
import {
    WidgetFormDialog,
    type DashboardWidgetFormData,
} from "modules/dashboards/widgets/widget_form_dialog";
import { useCreateIssueNavbarSettings } from "modules/issues/hooks/use-create-issue-navbar-settings";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { dashboardApi } from "shared/model";
import type { CreateDashboardTileT } from "shared/model/types";
import { ErrorHandler } from "shared/ui";
import { toastApiError } from "shared/utils";
import { saveToLS } from "shared/utils/helpers/local-storage";

interface DashboardViewProps {
    dashboardId: string;
}

export const DashboardView: FC<DashboardViewProps> = ({ dashboardId }) => {
    useCreateIssueNavbarSettings();

    const { t } = useTranslation();

    const [addWidgetDialogOpen, setAddWidgetDialogOpen] = useState(false);

    const { data, isLoading, error } =
        dashboardApi.useGetDashboardQuery(dashboardId);

    const [addWidget, { isLoading: isAdding }] =
        dashboardApi.useCreateDashboardTileMutation();

    const handleSubmitAddWidget = (formData: DashboardWidgetFormData) => {
        const data = {
            name: formData.name,
            ui_settings: {
                height: formData.height,
                polling_interval: formData.polling_interval,
            },
        };

        let body: CreateDashboardTileT;

        if (formData.type.type === "report") {
            body = {
                ...data,
                type: "report",

                report_id: formData.report_id || "",
            };
        } else {
            body = {
                ...data,
                type: "issue_list",
                query: formData.query || "",
            };
        }

        addWidget({
            id: dashboardId,
            body,
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
            <ErrorHandler
                error={error}
                message={t("dashboards.item.fetch.error")}
            />
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

            <Divider />

            <DashboardWidgets
                dashboard={dashboard}
                onAddWidget={() => setAddWidgetDialogOpen(true)}
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
