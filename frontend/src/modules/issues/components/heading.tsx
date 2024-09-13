import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import {
    Box,
    IconButton,
    Link,
    Menu,
    MenuItem,
    Typography,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { t } from "i18next";
import { FC, useState } from "react";
import { toast } from "react-toastify";
import { issueApi } from "store";
import { slugify } from "transliteration";
import { IssueT } from "types";
import { toastApiError } from "utils";
import { transformIssue } from "../utils";
import { DeleteIssueDialog } from "./delete_dialog";

interface IIssueHeadingProps {
    issue: IssueT;
}

const IssueHeading: FC<IIssueHeadingProps> = ({ issue }) => {
    const navigate = useNavigate();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const menuOpen = Boolean(anchorEl);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [createIssue] = issueApi.useCreateIssuesMutation();

    const handleClickMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleClickDeleteIssue = () => {
        handleCloseMenu();
        setDeleteDialogOpen(true);
    };

    const handleClickCloneIssue = () => {
        handleCloseMenu();

        createIssue(transformIssue(issue))
            .unwrap()
            .then((response) => {
                const issueId =
                    response.payload.id_readable || response.payload.id;
                toast.success(
                    <Typography>
                        {t("issues.clone.created")}:{" "}
                        <Link
                            href={`/issues/${issueId}`}
                            onClick={(e) => {
                                e.preventDefault();
                                navigate({
                                    to: "/issues/$issueId/$subject",
                                    params: {
                                        issueId,
                                        subject: slugify(issue.subject),
                                    },
                                });
                            }}
                        >
                            {issueId}
                        </Link>
                    </Typography>,
                    {
                        autoClose: false,
                        position: "bottom-right",
                    },
                );
            })
            .catch(toastApiError);
    };

    return (
        <Box
            width="calc(100% - 324px)"
            display="flex"
            alignItems="flex-start"
            gap={1}
        >
            <Typography fontSize={24} fontWeight="bold" flex={1}>
                {issue.subject}
            </Typography>

            <IconButton
                onClick={handleClickMenu}
                color={menuOpen ? "primary" : "inherit"}
                size="small"
            >
                <MoreHorizIcon />
            </IconButton>

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
                <MenuItem
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                    }}
                    onClick={handleClickCloneIssue}
                >
                    <ContentCopyIcon />

                    <Typography>{t("issues.clone")}</Typography>
                </MenuItem>

                <MenuItem
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                    }}
                    onClick={handleClickDeleteIssue}
                >
                    <DeleteIcon color="error" />

                    <Typography color="error">
                        {t("issues.delete.title")}
                    </Typography>
                </MenuItem>
            </Menu>

            <DeleteIssueDialog
                id={issue.id}
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            />
        </Box>
    );
};

export { IssueHeading };
