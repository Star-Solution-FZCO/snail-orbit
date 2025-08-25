import type { FC } from "react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { projectApi } from "shared/model";
import type { ProjectT } from "shared/model/types";
import FavoriteButton from "shared/ui/favorite_button";

type ProjectFavoriteButtonProps = {
    project: ProjectT;
};

export const ProjectFavoriteButton: FC<ProjectFavoriteButtonProps> = ({
    project,
}) => {
    const { t } = useTranslation();

    const [favorite] = projectApi.useFavoriteProjectMutation();
    const [unfavorite] = projectApi.useUnfavoriteProjectMutation();

    const handleToggleFavoriteButton = useCallback(() => {
        const mutation = project.is_favorite ? unfavorite : favorite;
        mutation(project.id);
    }, [project.is_favorite, project.id, unfavorite, favorite]);

    return (
        <FavoriteButton
            favorite={project.is_favorite}
            onClick={handleToggleFavoriteButton}
            size="medium"
            tooltip={
                project.is_favorite
                    ? t("projects.unfavorite")
                    : t("projects.favorite")
            }
            sx={{ p: 0 }}
        />
    );
};
