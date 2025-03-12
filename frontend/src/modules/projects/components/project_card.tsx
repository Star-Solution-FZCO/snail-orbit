import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { Avatar, Box, IconButton, Menu, MenuItem } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { Link } from "components";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProjectT } from "types";
import { useProjectFormTabs } from "../utils";

interface IProjectCardProps {
    project: ProjectT;
}

const ProjectCard: FC<IProjectCardProps> = ({ project }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const tabs = useProjectFormTabs();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const menuOpen = Boolean(anchorEl);

    const handleClickMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleClickLink = (tab: string) => {
        handleClose();
        navigate({
            to: "/projects/$projectId",
            params: { projectId: project.id },
            search: { tab },
        });
    };

    return (
        <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
                <Avatar
                    sx={{
                        width: 40,
                        height: 40,
                        fontSize: 16,
                        fontWeight: "bold",
                        mr: 2,
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

            <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleClose}>
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
