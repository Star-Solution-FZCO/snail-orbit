import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { Avatar, Box, IconButton, Menu, MenuItem } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { Link } from "components";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "store";
import type { ProjectT } from "types";
import type { ProjectFormTabKey } from "../utils";
import { useProjectFormTabs } from "../utils";
import { ProjectSubscribeButton } from "./project_subscribe_button";

interface IProjectCardProps {
    project: ProjectT;
}

const ProjectCard: FC<IProjectCardProps> = ({ project }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const isAdmin = useAppSelector((state) => state.profile.user?.is_admin);
    const tabs = useProjectFormTabs(isAdmin || false, project.is_encrypted);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const menuOpen = Boolean(anchorEl);

    const handleClickMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleClickLink = (tab: ProjectFormTabKey) => {
        handleClose();
        navigate({
            to: "/projects/$projectId",
            params: { projectId: project.id },
            search: { tab: tab },
        });
    };

    return (
        <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
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

                <Link
                    to="/projects/$projectId"
                    params={{ projectId: project.id }}
                    fontWeight="bold"
                >
                    {project.name}
                </Link>
            </Box>

            <IconButton onClick={handleClickMenu} size="small">
                <MoreHorizIcon />
            </IconButton>

            <Menu
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleClose}
            >
                {tabs.map((tab) => (
                    <MenuItem
                        key={tab.value}
                        onClick={() => handleClickLink(tab.value)}
                    >
                        {t(tab.label)}
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
};

export { ProjectCard };
