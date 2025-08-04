import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { FC } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { issueApi } from "shared/model";
import type { IssuePermissionOutput, IssueT } from "shared/model/types";
import { toastApiError, useListQueryParams } from "shared/utils";
import { AddIssuePermissionDialog } from "./add_issue_permission_dialog";

interface IIssuePermissionsProps {
    issue: IssueT;
}

const IssuePermissions: FC<IIssuePermissionsProps> = ({ issue }) => {
    const { t } = useTranslation();

    const [addPermissionDialogOpen, setAddPermissionDialogOpen] =
        useState(false);

    const [listQueryParams, updateListQueryParams] = useListQueryParams({
        limit: 50,
    });

    const {
        data: permissions,
        isLoading,
        isFetching,
    } = issueApi.useListIssuePermissionsQuery({
        id: issue.id_readable,
        params: listQueryParams,
    });

    const [revokeIssuePermission] = issueApi.useRevokeIssuePermissionMutation();

    const handleClickRemovePermission = (permission: IssuePermissionOutput) => {
        revokeIssuePermission({
            id: issue.id_readable,
            permissionId: permission.id,
        })
            .unwrap()
            .catch(toastApiError);
    };

    const columns: GridColDef<IssuePermissionOutput>[] = useMemo(
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
                headerName: t("projects.access.target.type"),
                width: 100,
                renderCell: ({ row }) => (
                    <Typography
                        variant="body2"
                        sx={{ textTransform: "capitalize" }}
                    >
                        {row.target_type}
                    </Typography>
                ),
            },
            {
                field: "target",
                headerName: t("projects.access.target.name"),
                flex: 1,
                renderCell: ({ row }) => {
                    // Handle both user and group targets
                    const targetName =
                        "name" in row.target ? row.target.name : "Unknown";
                    return (
                        <Typography variant="body2">{targetName}</Typography>
                    );
                },
            },
            {
                field: "role",
                headerName: t("projects.access.role"),
                flex: 1,
                renderCell: ({ row }) => (
                    <Typography variant="body2">{row.role.name}</Typography>
                ),
            },
        ],
        [t, handleClickRemovePermission],
    );

    const permissionsList = permissions?.payload?.items || [];

    return (
        <Stack spacing={2}>
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                <Typography variant="h6">
                    {t("projects.sections.access")}
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setAddPermissionDialogOpen(true)}
                >
                    {t("agileBoardForm.accessTab.add")}
                </Button>
            </Box>

            <DataGrid
                rows={permissionsList}
                columns={columns}
                loading={isLoading || isFetching}
                disableRowSelectionOnClick
                disableColumnMenu
                hideFooter
                density="compact"
                sx={{ border: "none" }}
            />

            <AddIssuePermissionDialog
                issue={issue}
                open={addPermissionDialogOpen}
                onClose={() => setAddPermissionDialogOpen(false)}
            />
        </Stack>
    );
};

export { IssuePermissions };
