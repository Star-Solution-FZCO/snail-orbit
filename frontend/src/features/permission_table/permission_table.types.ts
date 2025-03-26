import type { TableContainerProps } from "@mui/material";
import type { PermissionT, PermissionTypeT } from "types";

export type PermissionTableProps = {
    permissions: PermissionT[];
    onChangePermissionType?: (
        permission: PermissionT,
        type: PermissionTypeT,
    ) => void;
    onDeletePermission?: (permission: PermissionT) => void;
    containerComponent?: TableContainerProps["component"];
};
