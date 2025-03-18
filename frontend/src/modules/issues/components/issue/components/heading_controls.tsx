import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import {
    IconButton,
    Link,
    Menu,
    MenuItem,
    Tooltip,
    Typography,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import type { FC, ReactNode } from "react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { issueApi, toggleIssueLinks, useAppDispatch } from "store";
import { issueToCreateIssue } from "store/utils/issue";
import { slugify } from "transliteration";
import type { IssueT } from "types";
import { toastApiError } from "utils";
import { DeleteIssueDialog } from "./delete_dialog";
import { HeadingTagButton } from "./heading_tag_button";

interface IHeadingControlsProps {
    issue: IssueT;
}

export const HeadingControls: FC<IHeadingControlsProps> = ({ issue }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const menuOpen = Boolean(anchorEl);

    const [createIssue] = issueApi.useCreateIssueMutation();

    const handleClickLinkButton = () => {
        dispatch(toggleIssueLinks());
    };

    const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => setAnchorEl(null);

    const handleDeleteDialogOpen = () => {
        handleCloseMenu();
        setDeleteDialogOpen(true);
    };

    const renderMenuItem = (
        icon: ReactNode,
        label: string,
        onClick: () => void,
        iconColor?: "error",
    ) => (
        <MenuItem
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
            onClick={onClick}
        >
            {icon}
            <Typography color={iconColor}>{label}</Typography>
        </MenuItem>
    );

    const handleCloneIssue = () => {
        handleCloseMenu();

        createIssue(issueToCreateIssue(issue))
            .unwrap()
            .then((response) => {
                const issueId = response.payload.id_readable;

                toast.success(
                    <Typography>
                        {t("issues.clone.created")}:{" "}
                        <Link
                            onClick={() =>
                                navigate({
                                    to: "/issues/$issueId/$subject",
                                    params: {
                                        issueId,
                                        subject: slugify(
                                            response.payload.subject,
                                        ),
                                    },
                                })
                            }
                        >
                            {issueId}
                        </Link>
                    </Typography>,
                    {
                        autoClose: false,
                    },
                );
            })
            .catch(toastApiError);
    };

    return (
        <>
            <Tooltip title={t("issues.links.add.title")}>
                <IconButton onClick={handleClickLinkButton} size="small">
                    <LinkIcon />
                </IconButton>
            </Tooltip>

            <HeadingTagButton issue={issue} />

            <Tooltip title={t("issues.heading.showMore")}>
                <IconButton
                    onClick={handleOpenMenu}
                    color={menuOpen ? "primary" : "inherit"}
                    size="small"
                >
                    <MoreHorizIcon />
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleCloseMenu}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "left",
                }}
            >
                {renderMenuItem(
                    <ContentCopyIcon />,
                    t("issues.clone"),
                    handleCloneIssue,
                )}
                {renderMenuItem(
                    <DeleteIcon color="error" />,
                    t("issues.delete.title"),
                    handleDeleteDialogOpen,
                    "error",
                )}
            </Menu>

            <DeleteIssueDialog
                id={issue.id}
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            />
        </>
    );
};
