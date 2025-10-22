import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import InsertLinkIcon from "@mui/icons-material/InsertLink";
import LinkIcon from "@mui/icons-material/Link";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import {
    Divider,
    IconButton,
    Link,
    Menu,
    MenuItem,
    Tooltip,
    Typography,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useIssueTemplate } from "entities/issue/api/use_issue_template";
import type { FC, ReactNode } from "react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { issueApi } from "shared/model";
import { issueToCreateIssue } from "shared/model/mappers/issue";
import type { IssueT } from "shared/model/types";
import { toastApiError } from "shared/utils";
import { slugify } from "transliteration";
import { DeleteIssueDialog } from "../delete_dialog";
import { HeadingTagButton } from "../heading_tag_button";
import { IssuePermissionsDialog } from "../permissions/issue_permissions_dialog";

type HeadingControlsProps = {
    issue: IssueT;
    onAddLinkClick?: () => unknown;
};

export const HeadingControls: FC<HeadingControlsProps> = ({
    issue,
    onAddLinkClick,
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { copyTemplateUrl } = useIssueTemplate();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);

    const menuOpen = Boolean(anchorEl);

    const canManagePermissions =
        issue.access_claims?.includes("issue:manage_permissions") || false;

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
                                    to: "/issues/$issueId/{-$subject}",
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

    const handleManageIssueAccess = () => {
        if (!canManagePermissions) return;

        handleCloseMenu();
        setPermissionsDialogOpen(true);
    };

    const handleCopyTemplateUrl = () => {
        handleCloseMenu();
        copyTemplateUrl(issue);
    };

    return (
        <>
            <Tooltip title={t("issues.links.add.title")}>
                <IconButton onClick={onAddLinkClick} size="small">
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
                    <InsertLinkIcon />,
                    t("issues.template.copyUrl"),
                    handleCopyTemplateUrl,
                )}
                {canManagePermissions &&
                    renderMenuItem(
                        <ManageAccountsIcon />,
                        t("issues.access.manage"),
                        handleManageIssueAccess,
                    )}
                <Divider />
                {renderMenuItem(
                    <DeleteIcon color="error" />,
                    t("issues.delete.title"),
                    handleDeleteDialogOpen,
                    "error",
                )}
            </Menu>

            {canManagePermissions && (
                <IssuePermissionsDialog
                    issue={issue}
                    open={permissionsDialogOpen}
                    onClose={() => setPermissionsDialogOpen(false)}
                />
            )}

            <DeleteIssueDialog
                id={issue.id}
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            />
        </>
    );
};
