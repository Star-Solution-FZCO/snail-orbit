import { Avatar, Box, Button, InputLabel, Stack } from "@mui/material";
import type { FC } from "react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { projectApi, useAppSelector } from "shared/model";
import type { ProjectT, UpdateProjectT } from "shared/model/types";
import { toastApiError } from "shared/utils";
import { ProjectForm } from "./project_form";

interface IProjectGeneralInfoProps {
    project: ProjectT;
}

const ProjectGeneralInfo: FC<IProjectGeneralInfoProps> = ({ project }) => {
    const { t } = useTranslation();
    const isAdmin = useAppSelector(
        (state) => state.profile.user?.is_admin || false,
    );

    const canUpdateProject =
        isAdmin || project.access_claims?.includes("project:update") || false;

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [updateProject, { isLoading }] =
        projectApi.useUpdateProjectMutation();
    const [uploadAvatar] = projectApi.useUploadProjectAvatarMutation();
    const [deleteAvatar, { isLoading: deleteAvatarLoading }] =
        projectApi.useDeleteProjectAvatarMutation();

    const onSubmit = (formData: UpdateProjectT) => {
        updateProject({
            id: project.id,
            ...formData,
        })
            .unwrap()
            .then(() => {
                toast.success(t("projects.update.success"));
            })
            .catch(toastApiError);
    };

    const handleClickAvatar = () => {
        if (!canUpdateProject) return;
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error(t("projects.avatar.upload.invalidType"));
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        uploadAvatar({
            id: project.id,
            body: formData,
        })
            .unwrap()
            .then(() => {
                toast.success(t("projects.avatar.upload.success"));
            })
            .catch(toastApiError)
            .finally(() => {
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            });
    };

    const handleClickDelete = () => {
        const confirmed = confirm(t("projects.avatar.delete.confirm"));

        if (!confirmed) return;

        deleteAvatar(project.id)
            .unwrap()
            .then(() => {
                toast.success(t("projects.avatar.delete.success"));
            })
            .catch(toastApiError);
    };

    return (
        <Stack gap={2}>
            <Stack>
                <InputLabel shrink>{t("projects.avatar")}</InputLabel>

                <Stack direction="row" gap={2} alignItems="flex-start">
                    <Avatar
                        sx={{
                            width: 40,
                            height: 40,
                            fontSize: 16,
                            fontWeight: "bold",
                            cursor: canUpdateProject ? "pointer" : "default",
                        }}
                        src={project.avatar || ""}
                        onClick={handleClickAvatar}
                        variant="rounded"
                    >
                        {project.slug.slice(0, 3).toUpperCase()}
                    </Avatar>

                    {project.avatar && canUpdateProject && (
                        <Button
                            onClick={handleClickDelete}
                            variant="outlined"
                            size="small"
                            color="error"
                            loading={deleteAvatarLoading}
                        >
                            {t("projects.avatar.delete")}
                        </Button>
                    )}
                </Stack>

                <Box
                    ref={fileInputRef}
                    component="input"
                    type="file"
                    accept="image/*"
                    display="none"
                    onChange={handleFileChange}
                />
            </Stack>

            <ProjectForm
                defaultValues={project}
                onSubmit={onSubmit}
                loading={isLoading}
                readOnly={!canUpdateProject}
                hideCancel
            />
        </Stack>
    );
};

export { ProjectGeneralInfo };
