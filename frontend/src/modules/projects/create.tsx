import AddIcon from "@mui/icons-material/Add";
import { Container, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { Link, NavbarActionButton, useNavbarSettings } from "components";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { projectApi } from "store";
import { CreateProjectT } from "types";
import { toastApiError } from "utils";
import { ProjectForm } from "./components/project_form";

const ProjectCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { setAction } = useNavbarSettings();

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

    useEffect(() => {
        setAction(
            <Link to="/projects/create">
                <NavbarActionButton startIcon={<AddIcon />}>
                    {t("projects.new")}
                </NavbarActionButton>
            </Link>,
        );

        return () => setAction(null);
    }, [setAction]);

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
