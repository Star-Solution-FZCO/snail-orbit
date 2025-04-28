import { Breadcrumbs, Stack, Typography } from "@mui/material";
import { getRouteApi } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import type { UpdateWorkflowT } from "shared/model/types";
import { workflowApi } from "shared/model";
import { ErrorHandler, Link } from "shared/ui";
import { toastApiError } from "shared/utils";
import { WorkflowForm } from "./components/workflow_form";

const routeApi = getRouteApi("/_authenticated/workflows/$workflowId");

const WorkflowView = () => {
    const { t } = useTranslation();

    const { workflowId } = routeApi.useParams();

    const { data, error } = workflowApi.useGetWorkflowQuery(workflowId);

    const [updateWorkflow, { isLoading: updateLoading }] =
        workflowApi.useUpdateWorkflowMutation();

    const onSubmit = (formData: UpdateWorkflowT) => {
        const workflow = data?.payload;
        if (!workflow) return;

        updateWorkflow({
            id: workflow.id,
            ...formData,
        })
            .unwrap()
            .then(() => {
                toast.success(t("workflows.update.success"));
            })
            .catch(toastApiError);
    };

    if (error) {
        return (
            <ErrorHandler error={error} message="workflows.item.fetch.error" />
        );
    }

    if (!data) return null;

    const workflow = data.payload;

    return (
        <Stack px={4} pb={4} gap={2}>
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link to="/workflows" underline="hover">
                    <Typography fontSize={24} fontWeight="bold">
                        {t("workflows.title")}
                    </Typography>
                </Link>
                <Typography fontSize={24} fontWeight="bold">
                    {workflow.name}
                </Typography>
            </Breadcrumbs>

            <WorkflowForm
                defaultValues={workflow}
                onSubmit={onSubmit}
                loading={updateLoading}
            />
        </Stack>
    );
};

export { WorkflowView };
