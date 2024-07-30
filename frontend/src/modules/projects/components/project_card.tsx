import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import StarIcon from "@mui/icons-material/Star";
import { Avatar, Box, IconButton, Typography } from "@mui/material";
import { Link } from "@tanstack/react-router";
import { FC } from "react";
import { ProjectT } from "types";

interface IProjectCardProps {
    project: ProjectT;
}

const ProjectCard: FC<IProjectCardProps> = ({ project }) => {
    return (
        <Box display="flex" alignItems="center">
            <IconButton size="small">
                <StarIcon />
            </IconButton>

            <Avatar
                sx={{ width: 40, height: 40, fontSize: 14, ml: 1, mr: 2 }}
                variant="rounded"
            >
                {project.name.slice(0, 3).toUpperCase()}
            </Avatar>

            <Typography fontWeight="bold" flex={1}>
                <Link to={`/projects/${project.id}`}>{project.name}</Link>
            </Typography>

            <IconButton size="small">
                <MoreHorizIcon />
            </IconButton>
        </Box>
    );
};

export { ProjectCard };
