import CachedIcon from "@mui/icons-material/Cached";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CopyIcon from "@mui/icons-material/FileCopy";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Stack,
    Typography,
} from "@mui/material";
import type { FC, MouseEvent } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "shared/ui";
import { WidgetProps } from "./types";

interface WidgetHeadingProps extends WidgetProps {
    onRefresh?: () => void;
    loading?: boolean;
}

export const WidgetHeading: FC<WidgetHeadingProps> = ({
    widget,
    issueCount,
    onRefresh,
    onDelete,
    onClone,
    onEdit,
    canManage = false,
    loading = false,
}) => {
    const { t } = useTranslation();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleEdit = () => {
        handleMenuClose();
        onEdit(widget);
    };

    const handleClone = () => {
        handleMenuClose();
        onClone(widget);
    };

    const handleDelete = () => {
        handleMenuClose();
        onDelete(widget);
    };

    const linkProps = {
        to: widget.type === "issue_list" ? "/issues" : "/reports/$reportId",
        params: {
            reportId: widget.type === "report" ? widget.report.id : undefined,
        },
        search: {
            query: widget.type === "issue_list" ? widget.query : undefined,
        },
        underline: "hover" as const,
        fontWeight: "bold",
        target: "_blank",
        rel: "noopener noreferrer",
    };

    return (
        <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={1}
            px={2}
            py={1}
        >
            <Link {...linkProps}>
                {widget.name}

                <Typography component="sup" variant="caption">
                    {issueCount !== undefined ? ` ${issueCount}` : ""}
                </Typography>
            </Link>

            <Stack direction="row" alignItems="center" gap={1}>
                <IconButton
                    sx={{
                        "& svg": {
                            animation: loading
                                ? "spin 1s linear infinite reverse"
                                : "none",
                        },
                        "@keyframes spin": {
                            "0%": {
                                transform: "rotate(0deg)",
                            },
                            "100%": {
                                transform: "rotate(360deg)",
                            },
                        },
                    }}
                    onClick={onRefresh}
                    size="small"
                    disabled={loading}
                >
                    <CachedIcon fontSize="small" />
                </IconButton>

                {canManage && (
                    <IconButton onClick={handleMenuOpen} size="small">
                        <MoreVertIcon fontSize="small" />
                    </IconButton>
                )}
            </Stack>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
            >
                <MenuItem onClick={handleEdit}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>

                    <ListItemText>{t("dashboards.widgets.edit")}</ListItemText>
                </MenuItem>

                <MenuItem onClick={handleClone}>
                    <ListItemIcon>
                        <CopyIcon fontSize="small" />
                    </ListItemIcon>

                    <ListItemText>
                        <Typography>{t("dashboards.widgets.clone")}</Typography>
                    </ListItemText>
                </MenuItem>

                <MenuItem onClick={handleDelete}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" color="error" />
                    </ListItemIcon>

                    <ListItemText>
                        <Typography color="error">{t("delete")}</Typography>
                    </ListItemText>
                </MenuItem>
            </Menu>
        </Stack>
    );
};
