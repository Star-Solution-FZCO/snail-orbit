import { Container, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useCreateIssueNavbarSettings } from "modules/issues/hooks/use-create-issue-navbar-settings";
import { ReportForm } from "modules/reports/components/report_form";
import type { ReportFormValues } from "modules/reports/components/report_form.types";
import { reportFormValuesToEditFormValues } from "modules/reports/utils";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { reportApi } from "shared/model";
import { toastApiError } from "shared/utils";

export const ReportsCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    useCreateIssueNavbarSettings();

    const [createReport] = reportApi.useCreateReportMutation();

    const handleReportCreate = useCallback(
        (report: ReportFormValues) => {
            createReport(reportFormValuesToEditFormValues(report))
                .unwrap()
                .then((response) => {
                    toast.success(t("reports.create.success"));
                    navigate({
                        to: `/reports/$reportId`,
                        params: { reportId: response.payload.id },
                    });
                })
                .catch(toastApiError);
        },
        [createReport, navigate, t],
    );

    return (
        <Container sx={{ px: 4, pb: 4 }} disableGutters>
            <Typography fontSize={24} fontWeight="bold" mb={1}>
                {t("reports.create.title")}
            </Typography>

            <ReportForm
                onSubmit={handleReportCreate}
                onBack={() => navigate({ to: ".." })}
            />
        </Container>
    );
};
