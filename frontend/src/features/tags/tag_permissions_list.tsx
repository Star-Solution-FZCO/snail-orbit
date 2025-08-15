import DeleteIcon from "@mui/icons-material/Delete";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { FC } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { tagApi } from "shared/model";
import type { PermissionT, TagT } from "shared/model/types";
import { toastApiError, useListQueryParams } from "shared/utils";
import { AddTagPermissionDialog } from "./add_tag_permission_dialog";

interface TagPermissionsListProps {
    tag: TagT;
}

export const TagPermissionsList: FC<TagPermissionsListProps> = ({ tag }) => {
    const { t } = useTranslation();

    const [addPermissionDialogOpen, setAddPermissionDialogOpen] =
        useState(false);

    const [listQueryParams] = useListQueryParams();

    const {
        data: permissions,
        isLoading,
        isFetching,
    } = tagApi.useGetTagPermissionsQuery({
        tagId: tag.id,
        ...listQueryParams,
    });

    const [revokeTagPermission] = tagApi.useRevokeTagPermissionMutation();

    const handleClickRemovePermission = (permission: PermissionT) => {
        revokeTagPermission({
            tagId: tag.id,
            permissionId: permission.id,
        })
            .unwrap()
            .catch(toastApiError);
    };

    const columns: GridColDef<PermissionT>[] = useMemo(
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
                valueFormatter: (_, row) =>
                    t(`tags.access.target.${row.target_type}`),
            },
            {
                field: "target",
                headerName: t("tags.access.target.name"),
                flex: 1,
                valueGetter: (_, row) => {
                    return "name" in row.target
                        ? `${row.target.name}${"email" in row.target ? ` (${row.target.email})` : ""}`
                        : t("unknown");
                },
            },
            {
                field: "permission_type",
                headerName: t("tags.access.permission"),
                valueFormatter: (_, row) =>
                    t(`permissions.${row.permission_type}`),
                flex: 1,
            },
        ],
        [t, handleClickRemovePermission],
    );

    const permissionsList = permissions?.payload?.items || [];
    const loading = isLoading || isFetching;

    return (
        <Stack gap={2}>
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                <Typography variant="subtitle1">
                    {t("tags.access.list")}
                </Typography>

                <Button
                    onClick={() => setAddPermissionDialogOpen(true)}
                    startIcon={<VpnKeyIcon />}
                    variant="outlined"
                    size="small"
                >
                    {t("tags.access.grant")}
                </Button>
            </Box>

            <DataGrid
                rows={permissionsList}
                columns={columns}
                density="compact"
                loading={loading}
                disableRowSelectionOnClick
                disableColumnMenu
                hideFooter
            />

            <AddTagPermissionDialog
                tag={tag}
                open={addPermissionDialogOpen}
                onClose={() => setAddPermissionDialogOpen(false)}
            />
        </Stack>
    );
};
