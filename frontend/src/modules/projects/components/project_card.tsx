import { Avatar, Stack, Tooltip, Typography } from "@mui/material";
import { Link } from "components";
import type { FC } from "react";
import type { ProjectT } from "types";
import { ProjectSubscribeButton } from "./project_subscribe_button";

interface IProjectCardProps {
    project: ProjectT;
}

const ProjectCard: FC<IProjectCardProps> = ({ project }) => {
    return (
        <Stack direction="row" alignItems="center">
            <ProjectSubscribeButton project={project} />

            <Avatar
                sx={{
                    width: 40,
                    height: 40,
                    fontSize: 16,
                    fontWeight: "bold",
                    mx: 2,
                }}
                variant="rounded"
            >
                {project.name.slice(0, 3).toUpperCase()}
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
                    arrow
                    enterDelay={1000}
                    disableInteractive
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
                        {project.description}
                    </Typography>
                </Tooltip>
            </Stack>
        </Stack>
    );
};

export { ProjectCard };
