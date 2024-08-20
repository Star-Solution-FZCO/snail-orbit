import { Container, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import IssueForm from "modules/issues/components/issue_form.tsx";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { issueApi, projectApi } from "store";
import { CreateIssueT } from "types";

export const IssueCreate: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const { data: projects, isLoading: isProjectsLoading } =
        projectApi.useListProjectQuery();

    const [createIssue, { isLoading: isCreateProjectLoading }] =
        issueApi.useCreateIssuesMutation();

    const isLoading = isProjectsLoading || isCreateProjectLoading;

    const handleSubmit = (formData: CreateIssueT) => {
        createIssue(formData)
            .unwrap()
            .then((response) => {
                navigate({
                    to: "/issues/$issueId",
                    params: {
                        issueId: response.payload.id,
                    },
                });
                toast.success(t("issue.create.success"));
            })
            .catch((error) => {
                toast.error(error.data.detail || t("error.default"));
            });
    };

    return (
        <Container
            maxWidth="lg"
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
            <Typography fontSize={24} fontWeight="bold">
                {t("issues.create.title")}
            </Typography>

            <IssueForm
                projects={projects?.payload.items || []}
                onSubmit={handleSubmit}
                loading={isLoading}
            />
        </Container>
    );
};

export default IssueCreate;
