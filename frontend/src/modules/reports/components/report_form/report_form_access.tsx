import { useFormContext, useWatch } from "react-hook-form";
import { reportApi } from "shared/model";
import type { PermissionT, PermissionTargetT } from "shared/model/types";
import { PermissionsEditor } from "widgets/permissions_editor/permissions_editor";
import type { ReportFormValues } from "./report_form.types";

export const ReportFormAccess = () => {
    const [grantPermission] = reportApi.useGrantPermissionMutation();
    const [revokePermission] = reportApi.useRevokePermissionMutation();

    const form = useFormContext<ReportFormValues>();

    const { control } = form;

    const reportId = useWatch({ control, name: "id" });
    const permissions = useWatch({ control, name: "permissions" });

    const handleRemovePermission = (permission: PermissionT) => {
        revokePermission({ reportId, permissionId: permission.id });
    };

    const handleGrantPermission = (target: PermissionTargetT) => {
        grantPermission({
            reportId,
            target: target.id,
            target_type: "email" in target ? "user" : "group",
            permission_type: "edit",
        });
    };

    return (
        <PermissionsEditor
            permissions={permissions}
            onRevokePermission={handleRemovePermission}
            onGrantPermission={handleGrantPermission}
        />
    );
};
