import {
    type AutocompleteChangeReason,
    Box,
    Button,
    Stack,
} from "@mui/material";
import PermissionTable from "features/permission_table/permission_table";
import { UserGroupSelectPopover } from "features/user_group_select/user_group_select_popover";
import { bindPopover, bindTrigger } from "material-ui-popup-state";
import { usePopupState } from "material-ui-popup-state/hooks";
import { memo, type SyntheticEvent, useCallback, useMemo } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { BasicUserT, GroupT, PermissionT, PermissionTypeT } from "types";
import type { SearchFormValuesT } from "types/search";

const Access = memo(() => {
    const { t } = useTranslation();

    const popupState = usePopupState({
        popupId: "user-select-button",
        variant: "popover",
    });

    const { control } = useFormContext<SearchFormValuesT>();
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: "permissions",
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
                    fields.map((el) => el.target.id),
                );
                const selectedValue = tempValue.find(
                    (el) => !activePermissions.has(el.id),
                );
                if (!selectedValue) return;
                append({
                    target_type: "email" in selectedValue ? "user" : "group",
                    target: selectedValue,
                    permission_type: "view",
                    id: selectedValue.id,
                });
            } else {
                const activeValues = new Set(tempValue.map((el) => el.id));
                const deletedPermissionIdx = fields.findIndex(
                    (el) => !activeValues.has(el.target.id),
                );
                if (deletedPermissionIdx === -1) return;
                remove(deletedPermissionIdx);
            }
        },
        [append, fields, remove],
    );

    const handleRevokePermission = useCallback(
        (permission: PermissionT) => {
            const targetIdx = fields.findIndex((el) => el.id === permission.id);
            if (targetIdx === -1) return;
            remove(targetIdx);
        },
        [fields, remove],
    );

    const handleUpdatePermission = useCallback(
        (permission: PermissionT, type: PermissionTypeT) => {
            const targetIdx = fields.findIndex((el) => el.id === permission.id);
            if (targetIdx === -1 || !fields[targetIdx]) return;
            update(targetIdx, { ...fields[targetIdx], permission_type: type });
        },
        [fields, update],
    );

    const selectedTargets = useMemo(
        () => fields.map((el) => el.target),
        [fields],
    );

    return (
        <Stack gap={2}>
            <Box>
                <Button variant="contained" {...bindTrigger(popupState)}>
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
                permissions={fields}
                onDeletePermission={handleRevokePermission}
                onChangePermissionType={handleUpdatePermission}
            />
        </Stack>
    );
});

Access.displayName = "Access";

export default Access;
