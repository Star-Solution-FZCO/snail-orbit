import DeleteIcon from "@mui/icons-material/Delete";
import GroupIcon from "@mui/icons-material/Group";
import {
    Avatar,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";
import { bindMenu, bindTrigger } from "material-ui-popup-state";
import { usePopupState } from "material-ui-popup-state/hooks";
import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { permissionTypes, type PermissionTypeT } from "types";
import type { PermissionTableProps } from "./permission_table.types";

const PermissionTable = memo((props: PermissionTableProps) => {
    const { t } = useTranslation();
    const {
        permissions,
        onDeletePermission,
        onChangePermissionType,
        containerComponent,
    } = props;

    const popupState = usePopupState({
        variant: "popover",
        popupId: "select-permission-type",
    });

    const getPermissionTypeLabel = useCallback(
        (label: PermissionTypeT) => {
            switch (label) {
                case "view":
                    return t("permissionTable.label.view");
                case "edit":
                    return t("permissionTable.label.edit");
                case "admin":
                    return t("permissionTable.label.admin");
            }
        },
        [t],
    );

    return (
        <TableContainer component={containerComponent || Paper}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>
                            {t("permissionTable.accessTab.name")}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                            {t("permissionTable.accessTab.group")}
                        </TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {permissions.map((permission) => (
                        <TableRow
                            key={permission.id}
                            sx={{
                                "&:last-child td, &:last-child th": {
                                    border: 0,
                                },
                            }}
                        >
                            <TableCell>
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    gap={2}
                                >
                                    {"avatar" in permission.target ? (
                                        <Avatar
                                            src={permission.target.avatar}
                                            variant="rounded"
                                            sx={{ width: 24, height: 24 }}
                                        />
                                    ) : (
                                        <GroupIcon sx={{ fontSize: 24 }} />
                                    )}

                                    {permission.target.name}
                                </Stack>
                            </TableCell>
                            <TableCell>
                                <Button
                                    size="small"
                                    sx={{
                                        textTransform: "none",
                                        minWidth: 0,
                                    }}
                                    {...bindTrigger(popupState)}
                                >
                                    {getPermissionTypeLabel(
                                        permission.permission_type,
                                    )}
                                </Button>
                                <Menu {...bindMenu(popupState)}>
                                    {permissionTypes.map((type) => (
                                        <MenuItem
                                            selected={
                                                type ===
                                                permission.permission_type
                                            }
                                            onClick={() => {
                                                popupState.close();
                                                onChangePermissionType?.(
                                                    permission,
                                                    type,
                                                );
                                            }}
                                        >
                                            {getPermissionTypeLabel(type)}
                                        </MenuItem>
                                    ))}
                                </Menu>
                            </TableCell>
                            <TableCell align="right">
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                        onDeletePermission?.(permission)
                                    }
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
});

PermissionTable.displayName = "PermissionTable";

export default PermissionTable;
