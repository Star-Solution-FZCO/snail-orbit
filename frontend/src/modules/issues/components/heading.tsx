import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import {
    Box,
    IconButton,
    Menu,
    MenuItem,
    Tooltip,
    Typography,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { Link } from "components";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { t } from "i18next";
import { FC, useState } from "react";
import { toast } from "react-toastify";
import { issueApi, toggleIssueLinks, useAppDispatch } from "store";
import { slugify } from "transliteration";
import { IssueT } from "types";
import { toastApiError } from "utils";
import { transformIssue } from "../utils";
import { DeleteIssueDialog } from "./delete_dialog";

dayjs.extend(relativeTime);
dayjs.extend(utc);

interface IIssueHeadingProps {
    issue: IssueT;
}

const IssueHeading: FC<IIssueHeadingProps> = ({ issue }) => {
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

    const handleCloneIssue = () => {
        handleCloseMenu();
        createIssue(transformIssue(issue))
            .unwrap()
            .then((response) => {
                const issueId = response.payload.id_readable;
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
                    },
                );
            })
            .catch(toastApiError);
    };

    const renderTimestamp = (date: string) => (
        <Tooltip
            title={dayjs.utc(date).local().format("DD MMM YYYY HH:mm")}
            placement="bottom"
        >
            <Typography component="span" fontSize="inherit">
                {dayjs.utc(date).local().fromNow()}
            </Typography>
        </Tooltip>
    );

    const renderMenuItem = (
        icon: React.ReactNode,
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

    return (
        <Box
            width="calc(100% - 324px)"
            display="flex"
            flexDirection="column"
            gap={1}
        >
            <Box display="flex" alignItems="center" gap={2} fontSize={14}>
                <Link>{issue.id_readable}</Link>

                <Typography color="text.secondary" fontSize="inherit">
                    {t("createdBy")}{" "}
                    <Typography
                        component="span"
                        color="primary"
                        fontSize="inherit"
                    >
                        {issue.created_by.name}
                    </Typography>{" "}
                    {renderTimestamp(issue.created_at)}
                </Typography>

                {issue.updated_by && issue.updated_at && (
                    <Typography color="text.secondary" fontSize="inherit">
                        {t("updatedBy")}{" "}
                        <Typography
                            component="span"
                            color="primary"
                            fontSize="inherit"
                        >
                            {issue.updated_by.name}
                        </Typography>{" "}
                        {renderTimestamp(issue.updated_at)}
                    </Typography>
                )}
            </Box>

            <Box display="flex" alignItems="flex-start" gap={1}>
                <Typography fontSize={24} fontWeight="bold" flex={1}>
                    {issue.subject}
                </Typography>

                <Tooltip
                    title={t("issues.heading.links.add")}
                    onClick={handleClickLinkButton}
                >
                    <IconButton size="small">
                        <LinkIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title={t("issues.heading.showMore")}>
                    <IconButton
                        onClick={handleOpenMenu}
                        color={menuOpen ? "primary" : "inherit"}
                        size="small"
                    >
                        <MoreHorizIcon />
                    </IconButton>
                </Tooltip>
            </Box>

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
        </Box>
    );
};

export { IssueHeading };
