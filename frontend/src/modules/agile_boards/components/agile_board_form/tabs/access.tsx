import DeleteIcon from "@mui/icons-material/Delete";
import GroupIcon from "@mui/icons-material/Group";
import {
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
import type { OptionType } from "features/user_group_select_popover";
import { UserGroupSelectPopover } from "features/user_group_select_popover";
import PopupState, {
    bindMenu,
    bindPopover,
    bindTrigger,
} from "material-ui-popup-state";
import { FC, useCallback, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { agileBoardApi } from "store";
import { AgileBoardT, boardPermissionTypes, BoardPermissionTypeT } from "types";

export const Access: FC = () => {
    const { t } = useTranslation();

    const [grantPermission] = agileBoardApi.useGrantPermissionMutation();
    const [revokePermission] = agileBoardApi.useRevokePermissionMutation();
    const [changePermission] = agileBoardApi.useChangePermissionMutation();

    const { control, getValues } = useFormContext<AgileBoardT>();

    const boardId = useWatch({ control, name: "id" });
    const permissions = useWatch({ control, name: "permissions" });

    const getPermissionTypeLabel = useCallback(
        (label: BoardPermissionTypeT) => {
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
        (values: OptionType[], reason: "selectOption" | "removeOption") => {
            const permissions = getValues("permissions");

            if (reason === "selectOption") {
                const activePermissions = new Set(
                    permissions.map((el) => el.target.id),
                );
                const selectedValue = values.find(
                    (el) => !activePermissions.has(el.id),
                );
                if (!selectedValue) return;
                grantPermission({
                    board_id: boardId,
                    target_type: selectedValue.type,
                    target: selectedValue.id,
                    permission_type: "view",
                });
            } else {
                const activeValues = new Set(values.map((el) => el.value.id));
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
        (permissionId: string, type: BoardPermissionTypeT) => {
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
                                                    {boardPermissionTypes.map(
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
