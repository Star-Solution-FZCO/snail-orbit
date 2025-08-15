import CopyAllIcon from "@mui/icons-material/CopyAll";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import {
    Box,
    Button,
    capitalize,
    Chip,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { FC } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { issueApi } from "shared/model";
import type { IssuePermissionT, IssueT } from "shared/model/types";
import { toastApiError, useListQueryParams } from "shared/utils";
import { AddIssuePermissionDialog } from "./add_issue_permission_dialog";

interface IIssuePermissionsListProps {
    issue: IssueT;
}

const IssuePermissionsList: FC<IIssuePermissionsListProps> = ({ issue }) => {
    const { t } = useTranslation();

    const [addPermissionDialogOpen, setAddPermissionDialogOpen] =
        useState(false);

    const [listQueryParams] = useListQueryParams();

    const {
        data: permissions,
        isLoading,
        isFetching,
    } = issueApi.useListIssuePermissionsQuery({
        id: issue.id_readable,
        params: listQueryParams,
    });

    const [revokeIssuePermission] = issueApi.useRevokeIssuePermissionMutation();
    const [copyProjectPermissions] =
        issueApi.useCopyProjectPermissionsToIssueMutation();
    const [disableInheritance] =
        issueApi.useDisableProjectPermissionsInheritanceMutation();
    const [enableInheritance] =
        issueApi.useEnableProjectPermissionsInheritanceMutation();

    const handleCopyProjectPermissions = () => {
        copyProjectPermissions(issue.id_readable).unwrap().catch(toastApiError);
    };

    const handleDisableInheritance = () => {
        disableInheritance(issue.id_readable).unwrap().catch(toastApiError);
    };

    const handleEnableInheritance = () => {
        enableInheritance(issue.id_readable).unwrap().catch(toastApiError);
    };

    const handleClickRemovePermission = (permission: IssuePermissionT) => {
        revokeIssuePermission({
            id: issue.id_readable,
            permissionId: permission.id,
        })
            .unwrap()
            .catch(toastApiError);
    };

    const columns: GridColDef<IssuePermissionT>[] = useMemo(
        () => [
            {
                field: "delete",
                headerName: "",
                sortable: false,
                resizable: false,
                width: 60,
                align: "center",
                renderCell: ({ row }) => (
                    <IconButton
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClickRemovePermission(row);
                        }}
                        size="small"
                        color="error"
                    >
                        <DeleteIcon />
                    </IconButton>
                ),
            },
            {
                field: "target_type",
                headerName: t("type"),
                valueFormatter: (_, row) => capitalize(row.target_type),
            },
            {
                field: "target",
                headerName: t("issues.access.target.name"),
                flex: 1,
                valueGetter: (_, row) => {
                    return "name" in row.target
                        ? `${row.target.name}${"email" in row.target ? ` (${row.target.email})` : ""}`
                        : t("unknown");
                },
            },
            {
                field: "role",
                headerName: t("issues.access.role"),
                flex: 1,
                valueGetter: (_, row) => row.role.name,
            },
        ],
        [t, handleClickRemovePermission],
    );

    const permissionsList = permissions?.payload?.items || [];
    const loading = isLoading || isFetching;
    const inheritanceDisabled = issue.disable_project_permissions_inheritance;

    return (
        <Stack gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary">
                    {t("issues.projectPermissionsInheritance")}:
                </Typography>

                <Chip
                    label={t(inheritanceDisabled ? "disabled" : "enabled")}
                    icon={inheritanceDisabled ? <LockIcon /> : <LockOpenIcon />}
                    color={inheritanceDisabled ? "error" : "success"}
                    size="small"
                />
            </Box>

            <Box display="flex" gap={1} flexWrap="wrap">
                <Button
                    onClick={handleCopyProjectPermissions}
                    startIcon={<CopyAllIcon />}
                    variant="outlined"
                    size="small"
                    disabled={loading}
                >
                    {t("permissions.project.copy")}
                </Button>

                <Button
                    onClick={
                        inheritanceDisabled
                            ? handleEnableInheritance
                            : handleDisableInheritance
                    }
                    startIcon={
                        inheritanceDisabled ? <LockOpenIcon /> : <LockIcon />
                    }
                    color={inheritanceDisabled ? "success" : "error"}
                    variant="outlined"
                    size="small"
                    disabled={loading}
                >
                    {t(
                        inheritanceDisabled
                            ? "permissions.inheritance.enable"
                            : "permissions.inheritance.disable",
                    )}
                </Button>
            </Box>

            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                <Typography variant="subtitle1">
                    {t("issues.access.list")}
                </Typography>

                <Button
                    onClick={() => setAddPermissionDialogOpen(true)}
                    startIcon={<VpnKeyIcon />}
                    variant="outlined"
                    size="small"
                >
                    {t("issues.permissions.access.grant")}
                </Button>
            </Box>

            <DataGrid
                rows={permissionsList}
                columns={columns}
                loading={loading}
                density="compact"
                disableRowSelectionOnClick
                disableColumnMenu
                hideFooter
            />

            <AddIssuePermissionDialog
                issue={issue}
                open={addPermissionDialogOpen}
                onClose={() => setAddPermissionDialogOpen(false)}
            />
        </Stack>
    );
};

export { IssuePermissionsList };
