import type { PermissionT, PermissionTypeT } from "shared/model/types";

export type PermissionTableProps = {
    permissions: PermissionT[];
    onChangePermissionType?: (
        permission: PermissionT,
        type: PermissionTypeT,
    ) => void;
    onDeletePermission?: (permission: PermissionT) => void;
    disableChangeType?: boolean;
    disableDelete?: boolean;
};
