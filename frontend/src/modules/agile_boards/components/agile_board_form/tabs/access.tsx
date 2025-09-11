import type { FC } from "react";
import { useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { agileBoardApi } from "shared/model";
import type {
    AgileBoardT,
    PermissionT,
    PermissionTargetT,
    PermissionTypeT,
} from "shared/model/types";
import { PermissionsEditor } from "widgets/permissions_editor/permissions_editor";

export const Access: FC = () => {
    const [grantPermission] = agileBoardApi.useGrantPermissionMutation();
    const [revokePermission] = agileBoardApi.useRevokePermissionMutation();
    const [changePermission] = agileBoardApi.useChangePermissionMutation();

    const { control } = useFormContext<AgileBoardT>();

    const boardId = useWatch({ control, name: "id" });
    const permissions = useWatch({ control, name: "permissions" });

    const handleGrantPermissions = useCallback(
        (permissionTarget: PermissionTargetT) => {
            grantPermission({
                board_id: boardId,
                target_type: "email" in permissionTarget ? "user" : "group",
                target: permissionTarget.id,
                permission_type: "view",
            });
        },
        [boardId, grantPermission],
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

    return (
        <>
            <PermissionsEditor
                permissions={permissions}
                onChangePermission={handleChangePermission}
                onRevokePermission={handleRevokePermission}
                onGrantPermission={handleGrantPermissions}
            />
        </>
    );
};
