import DeleteIcon from "@mui/icons-material/Delete";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import StarIcon from "@mui/icons-material/Star";
import {
    Avatar,
    Box,
    IconButton,
    Menu,
    MenuItem,
    Typography,
} from "@mui/material";
import Link from "components/link";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { projectApi } from "store";
import { ProjectT } from "types";

interface IProjectCardProps {
    project: ProjectT;
}

const ProjectCard: FC<IProjectCardProps> = ({ project }) => {
    const { t } = useTranslation();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const menuOpen = Boolean(anchorEl);

    const [deleteProject] = projectApi.useDeleteProjectMutation();

    const handleClickMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleClickDelete = () => {
        handleClose();

        const confirmed = confirm(t("projects.delete.confirm"));

        if (!confirmed) return;

        deleteProject(project.id)
            .unwrap()
            .then(() => {
                toast.success(t("projects.delete.success"));
            })
            .catch((error) => {
                toast.error(error.data.detail || t("error.default"));
            });
    };

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

            <IconButton onClick={handleClickMenu} size="small">
                <MoreHorizIcon />
            </IconButton>

            <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleClose}>
                <MenuItem onClick={handleClickDelete}>
                    <Box
                        display="flex"
                        alignItems="center"
                        gap={0.5}
                        color="error.main"
                    >
                        <DeleteIcon />
                        <Typography>{t("projects.delete.title")}</Typography>
                    </Box>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export { ProjectCard };
