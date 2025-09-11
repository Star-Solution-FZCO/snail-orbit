import { Box, CircularProgress, Stack } from "@mui/material";
import { useCreateIssueNavbarSettings } from "modules/issues/hooks/use-create-issue-navbar-settings";
import { useState } from "react";
import { reportApi } from "shared/model";
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

    const { data, isLoading, isError, error } = reportApi.useGetReportQuery({
        reportId,
    });

    const report = data?.payload;

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
            </Box>
        </Stack>
    );
};
