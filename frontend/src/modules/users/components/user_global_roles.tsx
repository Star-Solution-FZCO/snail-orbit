import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Button, Chip, IconButton, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { FC } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { userApi } from "shared/model";
import type { GlobalRoleT } from "shared/model/types";
import { Link } from "shared/ui";
import { toastApiError, useListQueryParams } from "shared/utils";
import { AddUserGlobalRoleDialog } from "./add_user_global_role_dialog";

interface IUserGlobalRolesProps {
    userId: string;
}

const UserGlobalRoles: FC<IUserGlobalRolesProps> = ({ userId }) => {
    const { t } = useTranslation();

    const [addRoleDialogOpen, setAddRoleDialogOpen] = useState(false);

    const [listQueryParams, updateListQueryParams] = useListQueryParams({
        limit: 50,
    });

    const {
        data: roles,
        isLoading,
        isFetching,
    } = userApi.useListUserGlobalRolesQuery({
        userId,
        ...listQueryParams,
    });

    const [removeGlobalRoleFromUser] =
        userApi.useRemoveGlobalRoleFromUserMutation();

    const handleClickRemoveRole = (role: GlobalRoleT) => {
        removeGlobalRoleFromUser({ userId, roleId: role.id })
            .unwrap()
            .catch(toastApiError);
    };

    const columns: GridColDef<GlobalRoleT>[] = useMemo(
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
                            handleClickRemoveRole(row);
                        }}
                        size="small"
                        color="error"
                    >
                        <DeleteIcon />
                    </IconButton>
                ),
            },
            {
                field: "name",
                headerName: t("users.globalRoles.name"),
                flex: 1,
                renderCell: ({ row }) => (
                    <Link
                        to="/global-roles/$globalRoleId"
                        params={{ globalRoleId: row.id }}
                    >
                        {row.name}
                    </Link>
                ),
            },
            {
                field: "description",
                headerName: t("users.globalRoles.description"),
                flex: 1,
            },
            {
                field: "permissions",
                headerName: t("users.globalRoles.permissions"),
                flex: 2,
                sortable: false,
                renderCell: ({ row }) => {
                    const permissionCount = row.permissions.reduce(
                        (acc, group) =>
                            acc +
                            group.permissions.filter((p) => p.granted).length,
                        0,
                    );

                    return (
                        <Stack
                            direction="row"
                            alignItems="center"
                            gap={1}
                            flexWrap="wrap"
                            height={1}
                        >
                            {row.permissions.map((group) =>
                                group.permissions
                                    .filter((permission) => permission.granted)
                                    .map((permission) => (
                                        <Chip
                                            key={permission.key}
                                            label={permission.label}
                                            size="small"
                                            variant="outlined"
                                        />
                                    )),
                            )}

                            {permissionCount === 0 && (
                                <Chip
                                    label={t("users.globalRoles.noPermissions")}
                                    size="small"
                                    variant="outlined"
                                    color="secondary"
                                />
                            )}
                        </Stack>
                    );
                },
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

    const rows = roles?.payload.items || [];
    const rowCount = roles?.payload.count || 0;

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <Box>
                <Button
                    onClick={() => setAddRoleDialogOpen(true)}
                    startIcon={<AddIcon />}
                    variant="outlined"
                    size="small"
                >
                    {t("users.globalRoles.add")}
                </Button>
            </Box>

            <DataGrid
                sx={{
                    "& .MuiDataGrid-row": {
                        cursor: "pointer",
                    },
                }}
                columns={columns}
                rows={rows}
                rowCount={rowCount}
                paginationModel={paginationModel}
                onPaginationModelChange={handlePaginationModelChange}
                loading={isLoading || isFetching}
                paginationMode="server"
                density="compact"
            />

            <AddUserGlobalRoleDialog
                userId={userId}
                open={addRoleDialogOpen}
                onClose={() => setAddRoleDialogOpen(false)}
            />
        </Box>
    );
};

export { UserGlobalRoles };
