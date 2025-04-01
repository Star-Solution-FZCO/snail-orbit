import { StarButton } from "components";
import type { FC } from "react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { projectApi } from "store";
import type { ProjectT } from "types";

type ProjectSubscribeButtonProps = {
    project: ProjectT;
};

export const ProjectSubscribeButton: FC<ProjectSubscribeButtonProps> = ({
    project,
}) => {
    const { t } = useTranslation();

    const [subscribe] = projectApi.useSubscribeProjectMutation();
    const [unsubscribe] = projectApi.useUnsubscribeProjectMutation();

    const handleToggleSubscribeButton = useCallback(() => {
        const mutation = project.is_subscribed ? unsubscribe : subscribe;
        mutation(project.id);
    }, [project.id, project.is_subscribed, subscribe, unsubscribe]);

    return (
        <StarButton
            starred={project.is_subscribed}
            onClick={handleToggleSubscribeButton}
            size="small"
            tooltip={
                project.is_subscribed
                    ? t("projects.unsubscribe")
                    : t("projects.subscribe")
            }
            sx={{ p: 0 }}
        />
    );
};
