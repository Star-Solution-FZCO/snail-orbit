import { Container, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { DashboardForm } from "modules/dashboards/components/dashboard_form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { dashboardApi } from "shared/model";
import { CreateDashboardT } from "shared/model/types";
import { toastApiError } from "shared/utils";

export const DashboardCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [createDashboard, { isLoading }] =
        dashboardApi.useCreateDashboardMutation();

    const handleSubmit = (formData: CreateDashboardT) => {
        createDashboard(formData)
            .unwrap()
            .then((response) => {
                const newDashboard = response.payload;
                navigate({
                    to: "/dashboards/$dashboardId",
                    params: { dashboardId: newDashboard.id },
                });
                toast.success(t("dashboards.create.success"));
            })
            .catch(toastApiError);
    };

    return (
        <Container sx={{ px: 4, pb: 4 }} disableGutters>
            <Typography fontSize={24} fontWeight="bold" mb={1}>
                {t("dashboards.new")}
            </Typography>

            <DashboardForm
                onSubmit={handleSubmit}
                onCancel={() => navigate({ to: ".." })}
                loading={isLoading}
            />
        </Container>
    );
};
