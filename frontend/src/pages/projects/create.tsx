import AddIcon from "@mui/icons-material/Add";
import { Container, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import type { CreateProjectFormData } from "modules/projects/components/create_project_form";
import { CreateProjectForm } from "modules/projects/components/create_project_form";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { projectApi, useAppSelector } from "shared/model";
import { Link, NotFound } from "shared/ui";
import { NavbarActionButton } from "shared/ui/navbar/navbar_action_button";
import { useNavbarSettings } from "shared/ui/navbar/navbar_settings";
import { toastApiError } from "shared/utils";

const ProjectCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { setAction } = useNavbarSettings();

    const userAccessClaims =
        useAppSelector((state) => state.profile.user?.access_claims) || [];
    const isAdmin = useAppSelector(
        (state) => state.profile.user?.is_admin || false,
    );
    const canCreateProject =
        userAccessClaims.includes("global:project_create") || isAdmin;

    const [createProject, { isLoading }] =
        projectApi.useCreateProjectMutation();

    const onSubmit = async (formData: CreateProjectFormData) => {
        createProject({
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            encryption_settings:
                formData.is_encrypted &&
                formData.public_key &&
                formData.fingerprint
                    ? {
                          key: {
                              name: `X25519-${formData.fingerprint}`,
                              public_key: formData.public_key,
                              fingerprint: formData.fingerprint,
                              algorithm: "X25519",
                              is_active: true,
                          },
                          encrypt_comments: formData.encrypt_comments,
                          encrypt_description: formData.encrypt_description,
                      }
                    : undefined,
        })
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
            <Link to={"/issues/create"}>
                <NavbarActionButton startIcon={<AddIcon />}>
                    {t("issues.new")}
                </NavbarActionButton>
            </Link>,
        );

        return () => setAction(null);
    }, [setAction, t]);

    if (!canCreateProject) return <NotFound />;

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

            <CreateProjectForm onSubmit={onSubmit} loading={isLoading} />
        </Container>
    );
};

export { ProjectCreate };
