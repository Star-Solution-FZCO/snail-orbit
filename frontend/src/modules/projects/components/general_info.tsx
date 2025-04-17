import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { projectApi, useAppSelector } from "store";
import type { ProjectT, UpdateProjectT } from "types";
import { toastApiError } from "utils";
import { ProjectForm } from "./project_form";

interface IProjectGeneralInfoProps {
    project: ProjectT;
}

const ProjectGeneralInfo: FC<IProjectGeneralInfoProps> = ({ project }) => {
    const { t } = useTranslation();

    const isAdmin = useAppSelector((state) => state.profile.user?.is_admin);

    const [updateProject, { isLoading }] =
        projectApi.useUpdateProjectMutation();

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

    return (
        <ProjectForm
            defaultValues={project}
            onSubmit={onSubmit}
            loading={isLoading}
            readOnly={!isAdmin}
            hideCancel
        />
    );
};

export { ProjectGeneralInfo };
