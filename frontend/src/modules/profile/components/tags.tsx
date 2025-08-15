import { LocalOfferOutlined } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SecurityIcon from "@mui/icons-material/Security";
import { Box, Button, IconButton, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import { TagFormDialog } from "entities/tag/tag_form_dialog";
import { TagDeleteDialog } from "features/tags/tag_delete_dialog";
import { TagPermissionsDialog } from "features/tags/tag_permissions_dialog";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { tagApi } from "shared/model";
import type { TagT } from "shared/model/types";
import { toastApiError, useListQueryParams } from "shared/utils";

export const Tags = () => {
    const { t } = useTranslation();

    const [selectedTag, setSelectedTag] = useState<TagT | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [listQueryParams, updateListQueryParams] = useListQueryParams();

    const { data, isLoading, isFetching } =
        tagApi.useListTagsQuery(listQueryParams);

    const [deleteTag] = tagApi.useDeleteTagMutation();
    const [createTag] = tagApi.useCreateTagMutation();
    const [updateTag] = tagApi.useUpdateTagMutation();

    const handleCreate = () => {
        setSelectedTag(null);
        setEditDialogOpen(true);
    };

    const handleEdit = (tag: TagT) => {
        setSelectedTag(tag);
        setEditDialogOpen(true);
    };

    const handleDelete = (tag: TagT) => {
        setSelectedTag(tag);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!selectedTag) return;

        deleteTag(selectedTag.id)
            .unwrap()
            .then(() => {
                setDeleteDialogOpen(false);
                setSelectedTag(null);
            })
            .catch(toastApiError);
    };

    const handleTagCreate = (data: any) => {
        createTag(data)
            .unwrap()
            .then(() => {
                setEditDialogOpen(false);
            })
            .catch(toastApiError);
    };

    const handleTagUpdate = (data: any) => {
        updateTag(data)
            .unwrap()
            .then(() => {
                setEditDialogOpen(false);
            })
            .catch(toastApiError);
    };

    const handleManagePermissions = (tag: TagT) => {
        setSelectedTag(tag);
        setPermissionsDialogOpen(true);
    };

    const handleCloseEditDialog = () => {
        setEditDialogOpen(false);
        setSelectedTag(null);
    };

    const handleClosePermissionsDialog = () => {
        setPermissionsDialogOpen(false);
        setSelectedTag(null);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setSelectedTag(null);
    };

    const columns: GridColDef<TagT>[] = useMemo(
        () => [
            {
                field: "actions",
                headerName: t("actions"),
                width: 120,
                sortable: false,
                resizable: false,
                renderCell: ({ row }) => {
                    const canEdit = ["admin", "edit"].includes(
                        row.current_permission,
                    );
                    const canManagePermissions =
                        row.current_permission === "admin";

                    if (!canEdit && !canManagePermissions) {
                        return null;
                    }

                    return (
                        <Stack
                            direction="row"
                            alignItems="center"
                            gap={0.5}
                            height={1}
                        >
                            {canEdit && (
                                <IconButton
                                    size="small"
                                    onClick={() => handleEdit(row)}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            )}

                            {canManagePermissions && (
                                <>
                                    <IconButton
                                        size="small"
                                        onClick={() =>
                                            handleManagePermissions(row)
                                        }
                                    >
                                        <SecurityIcon fontSize="small" />
                                    </IconButton>

                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDelete(row)}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </>
                            )}
                        </Stack>
                    );
                },
            },
            {
                field: "color",
                headerName: t("tags.color"),
                width: 60,
                resizable: false,
                renderCell: ({ row }) => (
                    <Stack
                        height={1}
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Box
                            sx={{
                                bgcolor: row.color || "#fff",
                                width: 24,
                                height: 24,
                                borderRadius: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <LocalOfferOutlined
                                sx={{
                                    width: "75%",
                                    height: "75%",
                                }}
                            />
                        </Box>
                    </Stack>
                ),
            },
            {
                field: "name",
                headerName: t("tags.name"),
                flex: 1,
            },
            {
                field: "description",
                headerName: t("tags.description"),
                flex: 1,
            },
            {
                field: "current_permission",
                headerName: t("tags.permission"),
                valueFormatter: (_, row) =>
                    t(`permissions.${row.current_permission}`),
            },
        ],
        [t],
    );

    const paginationModel = {
        page: listQueryParams.offset / listQueryParams.limit,
        pageSize: listQueryParams.limit,
    };

    const handlePaginationModelChange = (model: {
        page: number;
        pageSize: number;
    }) => {
        updateListQueryParams({
            limit: model.pageSize,
            offset: model.page * model.pageSize,
        });
    };

    const rows = data?.payload?.items || [];
    const rowCount = data?.payload.count || 0;

    return (
        <Stack gap={2} height={1}>
            <Box>
                <Button onClick={handleCreate} variant="outlined" size="small">
                    {t("tags.create")}
                </Button>
            </Box>

            <DataGrid
                columns={columns}
                rows={rows}
                rowCount={rowCount}
                paginationModel={paginationModel}
                onPaginationModelChange={handlePaginationModelChange}
                loading={isLoading || isFetching}
                paginationMode="server"
                density="compact"
                disableRowSelectionOnClick
            />

            <TagFormDialog
                open={editDialogOpen}
                initialData={selectedTag}
                onClose={handleCloseEditDialog}
                onTagCreate={handleTagCreate}
                onTagUpdate={handleTagUpdate}
                isLoading={false}
            />

            {selectedTag && (
                <>
                    <TagPermissionsDialog
                        tag={selectedTag}
                        open={permissionsDialogOpen}
                        onClose={handleClosePermissionsDialog}
                    />
                    <TagDeleteDialog
                        tag={selectedTag}
                        open={deleteDialogOpen}
                        onClose={handleCloseDeleteDialog}
                        onConfirm={handleConfirmDelete}
                    />
                </>
            )}
        </Stack>
    );
};
