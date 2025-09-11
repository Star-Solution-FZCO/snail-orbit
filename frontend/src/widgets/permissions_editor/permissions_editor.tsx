import type { AutocompleteChangeReason } from "@mui/material";
import { Button, Paper, Stack } from "@mui/material";
import PermissionTable from "features/permission_table/permission_table";
import { UserGroupSelectPopover } from "features/user_group_select/user_group_select_popover";
import { bindPopover, bindTrigger } from "material-ui-popup-state";
import { usePopupState } from "material-ui-popup-state/hooks";
import type { SyntheticEvent } from "react";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type {
    PermissionT,
    PermissionTargetT,
    PermissionTypeT,
} from "shared/model/types";
import { type BasicUserT, type GroupT } from "shared/model/types";

type PermissionsEditorProps = {
    permissions: PermissionT[];
    onRevokePermission?: (permission: PermissionT) => void;
    onChangePermission?: (
        permission: PermissionT,
        type: PermissionTypeT,
    ) => void;
    onGrantPermission?: (target: PermissionTargetT) => void;
};

export const PermissionsEditor = (props: PermissionsEditorProps) => {
    const {
        permissions,
        onRevokePermission,
        onGrantPermission,
        onChangePermission,
    } = props;
    const { t } = useTranslation();

    const popupState = usePopupState({
        popupId: "user-select-button",
        variant: "popover",
    });

    const handleUserSelectChange = useCallback(
        (
            _: SyntheticEvent,
            value: (BasicUserT | GroupT)[] | (BasicUserT | GroupT) | null,
            reason: AutocompleteChangeReason,
        ) => {
            if (!value) return;
            const tempValue = Array.isArray(value) ? value : [value];

            if (reason === "selectOption") {
                const activePermissions = new Set(
                    permissions.map((el) => el.target.id),
                );
                const selectedValue = tempValue.find(
                    (el) => !activePermissions.has(el.id),
                );
                if (!selectedValue) return;
                onGrantPermission?.(selectedValue);
            } else {
                const activeValues = new Set(tempValue.map((el) => el.id));
                const deletedPermission = permissions.find(
                    (el) => !activeValues.has(el.target.id),
                );
                if (!deletedPermission) return;
                onRevokePermission?.(deletedPermission);
            }
        },
        [onGrantPermission, onRevokePermission, permissions],
    );

    const handleChangePermission = useCallback(
        (permission: PermissionT, type: PermissionTypeT) => {
            onChangePermission?.(permission, type);
        },
        [onChangePermission],
    );

    const handleRevokePermission = useCallback(
        (permission: PermissionT) => {
            onRevokePermission?.(permission);
        },
        [onRevokePermission],
    );

    const selectedTargets = useMemo(
        () => permissions.map((el) => el.target),
        [permissions],
    );

    return (
        <Stack direction="column" gap={1} component={Paper} sx={{ p: 1 }}>
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
            >
                <span>{t("permissionEditor.header")}</span>
                {onGrantPermission && (
                    <Button
                        variant="text"
                        size="small"
                        {...bindTrigger(popupState)}
                    >
                        {t("users.add")}
                    </Button>
                )}
                <UserGroupSelectPopover
                    {...bindPopover(popupState)}
                    multiple
                    onChange={handleUserSelectChange}
                    value={selectedTargets}
                />
            </Stack>
            <PermissionTable
                permissions={permissions}
                disableChangeType={!onChangePermission}
                disableDelete={!onRevokePermission}
                onDeletePermission={handleRevokePermission}
                onChangePermissionType={handleChangePermission}
            />
        </Stack>
    );
};
