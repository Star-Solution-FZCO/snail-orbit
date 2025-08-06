import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
    Box,
    Button,
    capitalize,
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

    const [listQueryParams] = useListQueryParams({
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
                width: 100,
                valueFormatter: (_, row) => capitalize(row.target_type),
            },
            {
                field: "target",
                headerName: t("issues.access.target.name"),
                flex: 1,
                valueGetter: (_, row) => {
                    return "name" in row.target
                        ? row.target.name
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

    return (
        <Stack gap={1}>
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
                    startIcon={<AddIcon />}
                    variant="outlined"
                    size="small"
                >
                    {t("add")}
                </Button>
            </Box>

            <DataGrid
                rows={permissionsList}
                columns={columns}
                loading={isLoading || isFetching}
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
