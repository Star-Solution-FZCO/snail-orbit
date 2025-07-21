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
import { issueApi } from "shared/model";
import { issueToCreateIssue } from "shared/model/mappers/issue";
import type { IssueT } from "shared/model/types";
import { toastApiError } from "shared/utils";
import { slugify } from "transliteration";
import { DeleteIssueDialog } from "./delete_dialog";
import { HeadingTagButton } from "./heading_tag_button";

type HeadingControlsProps = {
    issue: IssueT;
    onLinkClick?: () => unknown;
};

export const HeadingControls: FC<HeadingControlsProps> = ({
    issue,
    onLinkClick,
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const menuOpen = Boolean(anchorEl);

    const [createIssue] = issueApi.useCreateIssueMutation();

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
                <IconButton onClick={onLinkClick} size="small">
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
                    horizontal: "right",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
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
