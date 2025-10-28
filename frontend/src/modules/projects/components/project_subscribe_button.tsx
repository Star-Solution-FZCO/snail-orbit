import type { FC } from "react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { projectApi } from "shared/model";
import type { ProjectT } from "shared/model/types";
import { StarButton } from "shared/ui";

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
        mutation(project.slug);
    }, [project.slug, project.is_subscribed, subscribe, unsubscribe]);

    return (
        <StarButton
            starred={project.is_subscribed}
            onClick={handleToggleSubscribeButton}
            size="medium"
            tooltip={
                project.is_subscribed
                    ? t("projects.unsubscribe")
                    : t("projects.subscribe")
            }
            sx={{ p: 0 }}
        />
    );
};
