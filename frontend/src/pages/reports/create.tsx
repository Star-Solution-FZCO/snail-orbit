import { Container, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useCreateIssueNavbarSettings } from "modules/issues/hooks/use-create-issue-navbar-settings";
import { useTranslation } from "react-i18next";
import { CreateReportForm } from "../../modules/reports/components/create_report_form";

export const ReportsCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    useCreateIssueNavbarSettings();

    return (
        <Container sx={{ px: 4, pb: 4 }} disableGutters>
            <Typography fontSize={24} fontWeight="bold" mb={1}>
                {t("reports.create.title")}
            </Typography>

            <CreateReportForm onSubmit={console.log} />
        </Container>
    );
};
