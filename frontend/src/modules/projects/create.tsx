import AddIcon from "@mui/icons-material/Add";
import { Container, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { projectApi } from "shared/model";
import { Link } from "shared/ui";
import { NavbarActionButton } from "shared/ui/navbar/navbar_action_button";
import { useNavbarSettings } from "shared/ui/navbar/navbar_settings";
import { toastApiError } from "shared/utils";
import {
    exportPublicKey,
    generateKeyPair,
    getFingerprint,
} from "../../shared/utils/crypto";
import type { CreateProjectFormData } from "./components/create_project_form";
import { CreateProjectForm } from "./components/create_project_form";

const ProjectCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { setAction } = useNavbarSettings();

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
        setAction(
            <Link to="/projects/create">
                <NavbarActionButton startIcon={<AddIcon />}>
                    {t("projects.new")}
                </NavbarActionButton>
            </Link>,
        );

        return () => setAction(null);
    }, [setAction, t]);

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
