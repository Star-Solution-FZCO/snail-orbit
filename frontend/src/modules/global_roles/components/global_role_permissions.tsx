import {
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from "@mui/material";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { globalRoleApi } from "shared/model";
import type {
    GlobalPermissionGroupT,
    GlobalPermissionKeyT,
    GlobalRoleT,
} from "shared/model/types";
import { toastApiError } from "shared/utils";

interface IGlobalPermissionGroupProps {
    group: GlobalPermissionGroupT;
    onPermissionChange: (
        permissionKey: GlobalPermissionKeyT,
        granted: boolean,
    ) => void;
}

const GlobalPermissionGroup: FC<IGlobalPermissionGroupProps> = ({
    group,
    onPermissionChange,
}) => {
    const handlePermissionChange = (
        permissionKey: GlobalPermissionKeyT,
        granted: boolean,
    ) => {
        onPermissionChange(permissionKey, granted);
    };

    return (
        <>
            <TableRow>
                <TableCell sx={{ fontWeight: "bold" }} colSpan={2}>
                    {group.label}
                </TableCell>
            </TableRow>

            {group.permissions.map((permission) => (
                <TableRow key={permission.key}>
                    <TableCell sx={{ pl: 3 }}>{permission.label}</TableCell>
                    <TableCell>
                        <Checkbox
                            sx={{ p: 0 }}
                            checked={permission.granted}
                            onChange={(e) =>
                                handlePermissionChange(
                                    permission.key,
                                    e.target.checked,
                                )
                            }
                            size="small"
                        />
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
};

interface IGlobalRolePermissionsProps {
    role: GlobalRoleT;
}

const GlobalRolePermissions: FC<IGlobalRolePermissionsProps> = ({ role }) => {
    const { t } = useTranslation();

    const [grantPermission] = globalRoleApi.useGrantGlobalPermissionMutation();
    const [revokePermission] =
        globalRoleApi.useRevokeGlobalPermissionMutation();

    const handlePermissionChange = (
        permissionKey: GlobalPermissionKeyT,
        granted: boolean,
    ) => {
        const mutation = granted ? grantPermission : revokePermission;

        mutation({
            id: role.id,
            permissionKey,
        })
            .unwrap()
            .catch(toastApiError);
    };

    return (
        <Table size="small">
            <TableHead>
                <TableRow>
                    <TableCell width="400px">
                        {t("global-roles.sections.permissions")}
                    </TableCell>
                    <TableCell>
                        {t("global-roles.permissions.enabled")}
                    </TableCell>
                </TableRow>
            </TableHead>

            <TableBody>
                {role.permissions.map((group) => (
                    <GlobalPermissionGroup
                        key={group.label}
                        group={group}
                        onPermissionChange={handlePermissionChange}
                    />
                ))}
            </TableBody>
        </Table>
    );
};

export { GlobalRolePermissions };
