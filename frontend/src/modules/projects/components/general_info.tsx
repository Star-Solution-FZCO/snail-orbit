import { FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { projectApi } from "store";
import { ProjectT, UpdateProjectT } from "types";
import { ProjectForm } from "./project_form";

interface IProjectGeneralInfoProps {
    project: ProjectT;
}

const ProjectGeneralInfo: FC<IProjectGeneralInfoProps> = ({ project }) => {
    const { t } = useTranslation();

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
            .catch((error) => {
                toast.error(error.data.detail || t("error.default"));
            });
    };

    return (
        <ProjectForm
            defaultValues={project}
            onSubmit={onSubmit}
            loading={isLoading}
            hideCancel
        />
    );
};

export { ProjectGeneralInfo };
