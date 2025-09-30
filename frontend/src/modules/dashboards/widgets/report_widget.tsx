import { Skeleton, Stack, Typography } from "@mui/material";
import { ReportViewWidget } from "modules/reports/components/report_view_widget";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { reportApi } from "shared/model";
import { ReportTileOutput } from "shared/model/types/backend-schema.gen";
import { ReportDisplayType } from "shared/model/types/report";
import { WidgetBase } from "./base";
import type { WidgetProps } from "./types";

type ReportWidgetProps = WidgetProps;

export const ReportWidget: FC<ReportWidgetProps> = (props) => {
    const { t } = useTranslation();

    const widget = props.widget as ReportTileOutput;
    const reportId = widget.report.id;

    const {
        data: reportResponse,
        isLoading: reportLoading,
        error: reportError,
    } = reportApi.useGetReportQuery({
        reportId,
    });

    const {
        data: dataResponse,
        isLoading: isDataLoading,
        isFetching: isDataFetching,
        error: dataError,
        refetch,
    } = reportApi.useGetReportDataQuery({
        reportId,
    });

    const loading = reportLoading || isDataLoading || isDataFetching;
    const error = reportError || dataError;

    if (loading)
        return (
            <WidgetBase {...props} onRefresh={refetch}>
                <Stack px={2} pb={2} height={1}>
                    <Skeleton variant="rounded" height="100%" width="100%" />
                </Stack>
            </WidgetBase>
        );

    if (error)
        return (
            <WidgetBase {...props} onRefresh={refetch}>
                <Typography
                    variant="body1"
                    color="error"
                    fontWeight={500}
                    px={2}
                    pb={2}
                >
                    {t("dashboards.widgets.report.error")}
                </Typography>
            </WidgetBase>
        );

    const report = reportResponse?.payload;
    const reportData = dataResponse?.payload;
    const reportType =
        report?.ui_settings.report_type || ReportDisplayType.TABLE;

    return (
        <WidgetBase {...props} onRefresh={refetch} loading={loading}>
            <Stack overflow="auto" px={2} pb={2} width={1} height={1}>
                {report && reportData && (
                    <ReportViewWidget
                        reportData={reportData}
                        type={reportType}
                    />
                )}
            </Stack>
        </WidgetBase>
    );
};