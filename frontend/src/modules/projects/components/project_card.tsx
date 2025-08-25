import { Avatar, Stack, Tooltip, Typography } from "@mui/material";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { ProjectT } from "shared/model/types";
import { Link } from "shared/ui";
import { ProjectFavoriteButton } from "./project_favorite_button";
import { ProjectSubscribeButton } from "./project_subscribe_button";

interface IProjectCardProps {
    project: ProjectT;
}

const ProjectCard: FC<IProjectCardProps> = ({ project }) => {
    const { t } = useTranslation();

    return (
        <Stack direction="row" alignItems="center" gap={2}>
            <ProjectSubscribeButton project={project} />

            <ProjectFavoriteButton project={project} />

            <Avatar
                sx={{
                    width: 40,
                    height: 40,
                    fontSize: 16,
                    fontWeight: "bold",
                }}
                src={project.avatar || ""}
                variant="rounded"
            >
                {project.slug.slice(0, 3).toUpperCase()}
            </Avatar>

            <Stack overflow="hidden">
                <Link
                    to="/projects/$projectId"
                    params={{ projectId: project.id }}
                    fontWeight="bold"
                >
                    {project.name} ({project.slug})
                </Link>

                <Tooltip
                    title={project.description}
                    placement="top"
                    enterDelay={1000}
                    disableInteractive
                    arrow
                >
                    <Typography
                        variant="subtitle2"
                        color="textSecondary"
                        sx={{
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {project.description || t("description.empty")}
                    </Typography>
                </Tooltip>
            </Stack>
        </Stack>
    );
};

export { ProjectCard };
