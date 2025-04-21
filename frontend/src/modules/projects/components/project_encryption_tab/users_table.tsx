import DeleteIcon from "@mui/icons-material/Delete";
import {
    type AutocompleteChangeReason,
    Avatar,
    Box,
    Button,
    IconButton,
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
import { bindPopover, bindTrigger } from "material-ui-popup-state";
import { usePopupState } from "material-ui-popup-state/hooks";
import type { FC } from "react";
import { type SyntheticEvent, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { BasicUserT, EncryptionSettingsT } from "types";

type UsersTableProps = {
    encryptionSettings: EncryptionSettingsT;
    onUserAdded?: (user: BasicUserT) => void;
    onUserRemoved?: (user: BasicUserT) => void;
};

export const UsersTable: FC<UsersTableProps> = ({
    encryptionSettings,
    onUserAdded,
    onUserRemoved,
}) => {
    const { t } = useTranslation();

    const popupState = usePopupState({
        popupId: "encryption-tab-user-table",
        variant: "popover",
    });

    const handleUserSelectChange = useCallback(
        (
            _: SyntheticEvent,
            value: BasicUserT[] | BasicUserT | null,
            reason: AutocompleteChangeReason,
        ) => {
            if (!value) return;
            const tempValue = Array.isArray(value) ? value : [value];

            if (reason === "selectOption") {
                const activeUsers = new Set(
                    encryptionSettings.users.map((el) => el.id),
                );
                const selectedValue = tempValue.find(
                    (el) => !activeUsers.has(el.id),
                );
                if (!selectedValue || !onUserAdded) return;
                onUserAdded(selectedValue);
            } else {
                const activeUsers = new Set(
                    encryptionSettings.users.map((el) => el.id),
                );
                const deletedUser = encryptionSettings.users.find(
                    (el) => !activeUsers.has(el.id),
                );
                if (!deletedUser || !onUserRemoved) return;
                onUserRemoved(deletedUser);
            }
        },
        [encryptionSettings.users, onUserAdded, onUserRemoved],
    );

    return (
        <>
            <Box>
                <Button variant="contained" {...bindTrigger(popupState)}>
                    {t("projectEncryptionTab.usersTable.addUser")}
                </Button>
                <UserGroupSelectPopover
                    {...bindPopover(popupState)}
                    multiple
                    onChange={handleUserSelectChange}
                    value={encryptionSettings.users}
                    selectType="user"
                />
            </Box>
            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                {t("projectEncryptionTab.usersTable.user")}
                            </TableCell>
                            <TableCell sx={{ width: "40px" }} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {encryptionSettings.users.map((user) => (
                            <TableRow
                                key={user.id}
                                sx={{
                                    "&:last-child td, &:last-child th": {
                                        border: 0,
                                    },
                                }}
                            >
                                <TableCell>
                                    <Stack
                                        direction="row"
                                        gap={1}
                                        alignItems="center"
                                    >
                                        <Avatar
                                            src={user.avatar}
                                            variant="rounded"
                                            sx={{ width: 24, height: 24 }}
                                        />
                                        {user.name}
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => onUserRemoved?.(user)}
                                    >
                                        <DeleteIcon fontSize="inherit" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
};
