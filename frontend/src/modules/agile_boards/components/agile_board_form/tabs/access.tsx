import type { AutocompleteChangeReason } from "@mui/material";
import { Box, Button, Stack } from "@mui/material";
import PermissionTable from "features/permission_table/permission_table";
import { UserGroupSelectPopover } from "features/user_group_select/user_group_select_popover";
import { bindPopover, bindTrigger } from "material-ui-popup-state";
import { usePopupState } from "material-ui-popup-state/hooks";
import type { FC, SyntheticEvent } from "react";
import { useCallback, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { agileBoardApi } from "shared/model";
import type { AgileBoardT, PermissionT, PermissionTypeT } from "shared/model/types";
import { type BasicUserT, type GroupT } from "shared/model/types";

export const Access: FC = () => {
    const { t } = useTranslation();

    const popupState = usePopupState({
        popupId: "user-select-button",
        variant: "popover",
    });

    const [grantPermission] = agileBoardApi.useGrantPermissionMutation();
    const [revokePermission] = agileBoardApi.useRevokePermissionMutation();
    const [changePermission] = agileBoardApi.useChangePermissionMutation();

    const { control, getValues } = useFormContext<AgileBoardT>();

    const boardId = useWatch({ control, name: "id" });
    const permissions = useWatch({ control, name: "permissions" });

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
        [getValues, grantPermission, boardId, revokePermission],
    );

    const handleChangePermission = useCallback(
        (permission: PermissionT, type: PermissionTypeT) => {
            changePermission({
                board_id: boardId,
                permission_id: permission.id,
                permission_type: type,
            });
        },
        [boardId, changePermission],
    );

    const handleRevokePermission = useCallback(
        (permission: PermissionT) => {
            revokePermission({
                board_id: boardId,
                permission_id: permission.id,
            });
        },
        [boardId, revokePermission],
    );

    const selectedTargets = useMemo(
        () => permissions.map((el) => el.target),
        [permissions],
    );

    return (
        <Stack direction="column" gap={2}>
            <Box>
                <Button variant="outlined" {...bindTrigger(popupState)}>
                    {t("agileBoardForm.accessTab.add")}
                </Button>
                <UserGroupSelectPopover
                    {...bindPopover(popupState)}
                    multiple
                    onChange={handleUserSelectChange}
                    value={selectedTargets}
                />
            </Box>
            <PermissionTable
                permissions={permissions}
                onDeletePermission={handleRevokePermission}
                onChangePermissionType={handleChangePermission}
            />
        </Stack>
    );
};
