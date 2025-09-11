import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useCreateIssueNavbarSettings } from "modules/issues/hooks/use-create-issue-navbar-settings";
import type { ReportFormValues } from "modules/reports/components/report_form/report_form.types";
import { reportFormDefaultValues } from "modules/reports/components/report_form/report_form.types";
import { ReportFormMainInfo } from "modules/reports/components/report_form/report_form_main_info";
import { reportFormValuesToEditFormValues } from "modules/reports/utils";
import { useCallback } from "react";
import { FormProvider, useForm } from "react-hook-form";
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
        (values: ReportFormValues) => {
            createReport(reportFormValuesToEditFormValues(values))
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

    const form = useForm<ReportFormValues>({
        defaultValues: reportFormDefaultValues,
    });

    const { handleSubmit } = form;

    return (
        <Container sx={{ px: 4, pb: 4 }} disableGutters>
            <Typography fontSize={24} fontWeight="bold" mb={1}>
                {t("reports.create.title")}
            </Typography>

            <FormProvider {...form}>
                <Box
                    component="form"
                    display="flex"
                    flexDirection="column"
                    gap={2}
                    onSubmit={handleSubmit(handleReportCreate)}
                >
                    <ReportFormMainInfo />

                    <Stack direction="row" gap={1}>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={handleSubmit(handleReportCreate)}
                        >
                            {t("save")}
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            onClick={() => navigate({ to: ".." })}
                        >
                            {t("cancel")}
                        </Button>
                    </Stack>
                </Box>
            </FormProvider>
        </Container>
    );
};
