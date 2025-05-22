import { Breadcrumbs, Stack, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAppSelector, workflowApi } from "shared/model";
import type { CreateWorkflowT } from "shared/model/types";
import { Link, NotFound } from "shared/ui";
import { toastApiError } from "shared/utils";
import { WorkflowForm } from "./components/workflow_form";

const WorkflowCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const isAdmin = useAppSelector((state) => state.profile.user?.is_admin);

    const [createWorkflow, { isLoading }] =
        workflowApi.useCreateWorkflowMutation();

    const onSubmit = (formData: CreateWorkflowT) => {
        createWorkflow(formData)
            .unwrap()
            .then((response) => {
                navigate({
                    to: "/workflows/$workflowId",
                    params: { workflowId: response.payload.id },
                });
                toast.success(t("workflows.create.success"));
            })
            .catch(toastApiError);
    };

    if (!isAdmin) {
        return <NotFound />;
    }

    return (
        <Stack px={4} pb={4} gap={2}>
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link to="/workflows" underline="hover">
                    <Typography fontSize={24} fontWeight="bold">
                        {t("workflows.title")}
                    </Typography>
                </Link>
                <Typography fontSize={24} fontWeight="bold">
                    {t("workflows.create.title")}
                </Typography>
            </Breadcrumbs>

            <WorkflowForm onSubmit={onSubmit} loading={isLoading} />
        </Stack>
    );
};

export { WorkflowCreate };
