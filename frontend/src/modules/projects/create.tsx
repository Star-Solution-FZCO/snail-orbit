import AddIcon from "@mui/icons-material/Add";
import { Container, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { projectApi, useAppSelector } from "shared/model";
import { Link, NotFound } from "shared/ui";
import { NavbarActionButton } from "shared/ui/navbar/navbar_action_button";
import { useNavbarSettings } from "shared/ui/navbar/navbar_settings";
import { toastApiError } from "shared/utils";
import {
    exportPublicKey,
    generateKeyPair,
    getFingerprint,
} from "shared/utils/crypto/crypto";
import type { CreateProjectFormData } from "./components/create_project_form";
import { CreateProjectForm } from "./components/create_project_form";

const ProjectCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { setAction } = useNavbarSettings();

    const userAccessClaims =
        useAppSelector((state) => state.profile.user?.access_claims) || [];
    const canCreateProject = userAccessClaims.includes("global:project_create");

    const [createProject, { isLoading }] =
        projectApi.useCreateProjectMutation();

    const onSubmit = async (formData: CreateProjectFormData) => {
        const keyPair = await generateKeyPair("RSA");
        const fingerprint = await getFingerprint(keyPair.publicKey);
        const publicKey = await exportPublicKey(keyPair.publicKey);
        const name = `RSA-${fingerprint}`;
        createProject({
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            encryption_settings: formData.is_encrypted
                ? {
                      key: {
                          name,
                          public_key: publicKey,
                          fingerprint,
                          algorithm: "RSA",
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
        const path = canCreateProject ? "/projects/create" : "/issues/create";
        setAction(
            <Link to={path}>
                <NavbarActionButton startIcon={<AddIcon />}>
                    {t(canCreateProject ? "projects.new" : "issues.new")}
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
