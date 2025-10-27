import { useFormContext, useWatch } from "react-hook-form";
import { reportApi } from "shared/model";
import type {
    PermissionT,
    PermissionTargetT,
    PermissionTypeT,
} from "shared/model/types";
import { PermissionsEditor } from "widgets/permissions_editor/permissions_editor";
import type { ReportFormValues } from "./report_form.types";

export const ReportFormAccess = () => {
    const [grantPermission] = reportApi.useGrantPermissionMutation();
    const [revokePermission] = reportApi.useRevokePermissionMutation();
    const [changePermission] = reportApi.useChangePermissionMutation();

    const form = useFormContext<ReportFormValues>();

    const { control } = form;

    const reportId = useWatch({ control, name: "id" });
    const permissions = useWatch({ control, name: "permissions" });

    const handleGrantPermission = (target: PermissionTargetT) => {
        grantPermission({
            reportId,
            target: target.id,
            target_type: "email" in target ? "user" : "group",
            permission_type: "view",
        });
    };

    const handleChangePermission = (
        permission: PermissionT,
        type: PermissionTypeT,
    ) => {
        changePermission({
            reportId,
            permission_id: permission.id,
            permission_type: type,
        });
    };

    const handleRemovePermission = (permission: PermissionT) => {
        revokePermission({ reportId, permissionId: permission.id });
    };
    return (
        <PermissionsEditor
            permissions={permissions}
            onRevokePermission={handleRemovePermission}
            onGrantPermission={handleGrantPermission}
            onChangePermission={handleChangePermission}
        />
    );
};
