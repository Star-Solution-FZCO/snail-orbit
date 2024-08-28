import {
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from "@mui/material";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { roleApi } from "store";
import { PermissionGroupT, PermissionKeyT, RoleT } from "types";
import { toastApiError } from "utils";

interface IPermissionGroupProps {
    group: PermissionGroupT;
    onPermissionChange: (
        permissionKey: PermissionKeyT,
        granted: boolean,
    ) => void;
}

const PermissionGroup: FC<IPermissionGroupProps> = ({
    group,
    onPermissionChange,
}) => {
    const handlePermissionChange = (
        permissionKey: PermissionKeyT,
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

interface IRolePermissionsProps {
    role: RoleT;
}

const RolePermissions: FC<IRolePermissionsProps> = ({ role }) => {
    const { t } = useTranslation();

    const [grantPermission] = roleApi.useGrantPermissionMutation();
    const [revokePermission] = roleApi.useRevokePermissionMutation();

    const handlePermissionChange = (
        permissionKey: PermissionKeyT,
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
                        {t("roles.sections.permissions")}
                    </TableCell>
                    <TableCell>{t("roles.permissions.enabled")}</TableCell>
                </TableRow>
            </TableHead>

            <TableBody>
                {role.permissions.map((group) => (
                    <PermissionGroup
                        key={group.label}
                        group={group}
                        onPermissionChange={handlePermissionChange}
                    />
                ))}
            </TableBody>
        </Table>
    );
};

export { RolePermissions };
