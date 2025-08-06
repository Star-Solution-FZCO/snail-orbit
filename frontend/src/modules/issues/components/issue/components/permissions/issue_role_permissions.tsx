import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from "@mui/material";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { PermissionGroupT, RoleT } from "shared/model/types";

interface IPermissionGroupProps {
    group: PermissionGroupT;
}

const PermissionGroup: FC<IPermissionGroupProps> = ({ group }) => {
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
                    <TableCell align="center">
                        {permission.granted ? (
                            <CheckIcon fontSize="small" />
                        ) : (
                            <CloseIcon fontSize="small" />
                        )}
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
};

interface IIssueRolePermissionsProps {
    role: RoleT;
}

export const IssueRolePermissions: FC<IIssueRolePermissionsProps> = ({
    role,
}) => {
    const { t } = useTranslation();

    return (
        <Table size="small" stickyHeader>
            <TableHead>
                <TableRow>
                    <TableCell width="300px">
                        {t("roles.sections.permissions")}
                    </TableCell>
                    <TableCell align="center">
                        {t("roles.permissions.enabled")}
                    </TableCell>
                </TableRow>
            </TableHead>

            <TableBody>
                {role.permissions
                    .filter((group) => group.label !== "Project")
                    .map((group) => (
                        <PermissionGroup key={group.label} group={group} />
                    ))}
            </TableBody>
        </Table>
    );
};
