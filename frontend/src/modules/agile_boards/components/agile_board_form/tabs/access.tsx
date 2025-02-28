import DeleteIcon from "@mui/icons-material/Delete";
import GroupIcon from "@mui/icons-material/Group";
import {
    AutocompleteChangeReason,
    Avatar,
    Box,
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
import { UserGroupSelectPopover } from "features/user_group_select/user_group_select_popover";
import PopupState, {
    bindMenu,
    bindPopover,
    bindTrigger,
} from "material-ui-popup-state";
import { FC, SyntheticEvent, useCallback, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { agileBoardApi } from "store";
import {
    AgileBoardT,
    type BasicUserT,
    type GroupT,
    permissionTypes,
    PermissionTypeT,
} from "types";

export const Access: FC = () => {
    const { t } = useTranslation();

    const [grantPermission] = agileBoardApi.useGrantPermissionMutation();
    const [revokePermission] = agileBoardApi.useRevokePermissionMutation();
    const [changePermission] = agileBoardApi.useChangePermissionMutation();

    const { control, getValues } = useFormContext<AgileBoardT>();

    const boardId = useWatch({ control, name: "id" });
    const permissions = useWatch({ control, name: "permissions" });

    const getPermissionTypeLabel = useCallback(
        (label: PermissionTypeT) => {
            switch (label) {
                case "view":
                    return t("boardPermissionType.view");
                case "edit":
                    return t("boardPermissionType.edit");
                case "admin":
                    return t("boardPermissionType.admin");
            }
        },
        [t],
    );

    const handleUserSelectChange = useCallback(
        (
            _: SyntheticEvent,
            value: (BasicUserT | GroupT)[] | (BasicUserT | GroupT) | null,
            reason: AutocompleteChangeReason,
        ) => {
            if (!value) return;
            const permissions = getValues("permissions");
            const tempValue = Array.isArray(value) ? value : [value];

            if (reason === "selectOption") {
                const activePermissions = new Set(
                    permissions.map((el) => el.target.id),
                );
                const selectedValue = tempValue.find(
                    (el) => !activePermissions.has(el.id),
                );
                if (!selectedValue) return;
                grantPermission({
                    board_id: boardId,
                    target_type: "email" in selectedValue ? "user" : "group",
                    target: selectedValue.id,
                    permission_type: "view",
                });
            } else {
                const activeValues = new Set(tempValue.map((el) => el.id));
                const deletedPermission = permissions.find(
                    (el) => !activeValues.has(el.target.id),
                );
                if (!deletedPermission) return;
                revokePermission({
                    board_id: boardId,
                    permission_id: deletedPermission.id,
                });
            }
        },
        [getValues, boardId],
    );

    const handleChangePermission = useCallback(
        (permissionId: string, type: PermissionTypeT) => {
            return () =>
                changePermission({
                    board_id: boardId,
                    permission_id: permissionId,
                    permission_type: type,
                });
        },
        [boardId],
    );

    const handleRevokePermission = useCallback(
        (id: string) => {
            return () => {
                revokePermission({ board_id: boardId, permission_id: id });
            };
        },
        [boardId],
    );

    const selectedTargets = useMemo(
        () => permissions.map((el) => el.target),
        [permissions],
    );

    return (
        <Stack direction="column" gap={2}>
            <Box>
                <PopupState popupId="user-select-button" variant="popover">
                    {(popupState) => (
                        <>
                            <Button
                                variant="outlined"
                                {...bindTrigger(popupState)}
                            >
                                {t("agileBoardForm.accessTab.add")}
                            </Button>
                            <UserGroupSelectPopover
                                {...bindPopover(popupState)}
                                multiple
                                onChange={handleUserSelectChange}
                                value={selectedTargets}
                            />
                        </>
                    )}
                </PopupState>
            </Box>
            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>
                                {t("agileBoardForm.accessTab.name")}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>
                                {t("agileBoardForm.accessTab.group")}
                            </TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {permissions.map(({ id, target, permission_type }) => (
                            <TableRow
                                key={id}
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
                                        {"avatar" in target ? (
                                            <Avatar
                                                src={target.avatar}
                                                variant="rounded"
                                                sx={{ width: 24, height: 24 }}
                                            />
                                        ) : (
                                            <GroupIcon sx={{ fontSize: 24 }} />
                                        )}

                                        {target.name}
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <PopupState
                                        variant="popover"
                                        popupId="select-permission-type"
                                    >
                                        {(popupState) => (
                                            <>
                                                <Button
                                                    size="small"
                                                    sx={{
                                                        textTransform: "none",
                                                        minWidth: 0,
                                                    }}
                                                    {...bindTrigger(popupState)}
                                                >
                                                    {getPermissionTypeLabel(
                                                        permission_type,
                                                    )}
                                                </Button>
                                                <Menu {...bindMenu(popupState)}>
                                                    {permissionTypes.map(
                                                        (type) => (
                                                            <MenuItem
                                                                selected={
                                                                    type ===
                                                                    permission_type
                                                                }
                                                                onClick={handleChangePermission(
                                                                    id,
                                                                    type,
                                                                )}
                                                            >
                                                                {getPermissionTypeLabel(
                                                                    type,
                                                                )}
                                                            </MenuItem>
                                                        ),
                                                    )}
                                                </Menu>
                                            </>
                                        )}
                                    </PopupState>
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={handleRevokePermission(id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Stack>
    );
};
