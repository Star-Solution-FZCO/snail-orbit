import { Delete, Edit, MoreVert } from "@mui/icons-material";
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
import { DashboardTileT } from "shared/model/types";
import { Link } from "shared/ui";

interface WidgetHeadingProps {
    widget: DashboardTileT;
    onEdit: (widget: DashboardTileT) => void;
    onDelete: (widget: DashboardTileT) => void;
    canManage?: boolean;
}

export const WidgetHeading: FC<WidgetHeadingProps> = ({
    widget,
    onDelete,
    onEdit,
    canManage = false,
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

    const handleDelete = () => {
        handleMenuClose();
        onDelete(widget);
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
            <Link
                to="/issues"
                search={{
                    query: widget.query,
                }}
                underline="hover"
                fontWeight="bold"
            >
                {widget.name}
            </Link>

            {canManage && (
                <IconButton onClick={handleMenuOpen} size="small">
                    <MoreVert fontSize="small" />
                </IconButton>
            )}

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
                        <Edit fontSize="small" />
                    </ListItemIcon>

                    <ListItemText>{t("dashboards.widgets.edit")}</ListItemText>
                </MenuItem>

                <MenuItem onClick={handleDelete}>
                    <ListItemIcon>
                        <Delete fontSize="small" color="error" />
                    </ListItemIcon>

                    <ListItemText>
                        <Typography color="error">{t("delete")}</Typography>
                    </ListItemText>
                </MenuItem>
            </Menu>
        </Stack>
    );
};
