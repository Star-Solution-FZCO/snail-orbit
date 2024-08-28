import { Container, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { projectApi } from "store";
import { CreateProjectT } from "types";
import { toastApiError } from "utils";
import { ProjectForm } from "./components/project_form";

const ProjectCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [createProject, { isLoading }] =
        projectApi.useCreateProjectMutation();

    const onSubmit = (formData: CreateProjectT) => {
        createProject(formData)
            .unwrap()
            .then((response) => {
                navigate({
                    to: "/projects/$projectId",
                    params: {
                        projectId: response.payload.id,
                    },
                });
                toast.success(t("projects.create.success"));
            })
            .catch(toastApiError);
    };

    return (
        <Container
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                px: 4,
                pb: 4,
            }}
            disableGutters
        >
            <Typography fontSize={24} fontWeight="bold">
                {t("projects.create.title")}
            </Typography>

            <ProjectForm onSubmit={onSubmit} loading={isLoading} />
        </Container>
    );
};

export { ProjectCreate };
