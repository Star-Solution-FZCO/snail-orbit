import { Box, CircularProgress, Paper, Stack } from "@mui/material";
import { useCreateIssueNavbarSettings } from "modules/issues/hooks/use-create-issue-navbar-settings";
import { ReportViewWidget } from "modules/reports/components/report_view_widget";
import { useState } from "react";
import { reportApi } from "shared/model";
import { ReportDisplayType } from "shared/model/types/report";
import { ErrorHandler } from "shared/ui";
import { ReportEditSection } from "./components/report_edit_section";
import { ReportTopBar } from "./components/reports_top_bar";

type ReportViewProps = {
    reportId: string;
};

export const ReportView = (props: ReportViewProps) => {
    const { reportId } = props;

    useCreateIssueNavbarSettings();

    const [isReportFormOpen, setIsReportFormOpen] = useState(false);

    const {
        data: reportResponse,
        isLoading: isReportLoading,
        isError: isReportError,
        error: reportError,
    } = reportApi.useGetReportQuery(reportId);

    const {
        data: reportDataResponse,
        isLoading: isDataLoading,
        isError: isDataError,
        error: dataError,
    } = reportApi.useGetReportDataQuery({
        reportId,
    });

    const report = reportResponse?.payload;
    const isLoading = isReportLoading || isDataLoading;
    const isError = isReportError || isDataError;
    const error = reportError || dataError;
    const isMinSize =
        report?.ui_settings.report_type === ReportDisplayType.TABLE;

    return (
        <Stack px={4} pb={4} height="100%" gap={1}>
            <ReportTopBar
                report={report}
                onEditClick={() => setIsReportFormOpen((prev) => !prev)}
            />
            {isReportFormOpen && !!report && (
                <ReportEditSection report={report} />
            )}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    width: "100%",
                }}
            >
                {isLoading && <CircularProgress size={48} />}
                {isError && <ErrorHandler error={error} />}
                {!isLoading &&
                    !isError &&
                    !!reportDataResponse?.payload &&
                    !!report && (
                        <Paper
                            sx={{
                                p: 2,
                                width: isMinSize ? "auto" : "100%",
                                height: isMinSize ? "auto" : "100%",
                            }}
                        >
                            <ReportViewWidget
                                reportData={reportDataResponse.payload}
                                type={
                                    report.ui_settings.report_type ||
                                    ReportDisplayType.TABLE
                                }
                            />
                        </Paper>
                    )}
            </Box>
        </Stack>
    );
};
