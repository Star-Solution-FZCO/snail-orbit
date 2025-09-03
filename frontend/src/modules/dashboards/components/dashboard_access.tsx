import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupIcon from "@mui/icons-material/Group";
import {
    Autocomplete,
    Box,
    Button,
    CircularProgress,
    debounce,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    TextField,
    Typography,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { FC } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { dashboardApi, userApi } from "shared/model";
import type {
    BasicUserT,
    DashboardT,
    ListSelectQueryParams,
    PermissionT,
    PermissionTypeT,
    UserOrGroupT,
} from "shared/model/types";
import { UserAvatar } from "shared/ui";
import { toastApiError, useListQueryParams } from "shared/utils";

interface GrantPermissionDialogProps {
    dashboardId: string;
    open: boolean;
    onClose: () => void;
}

const GrantPermissionDialog: FC<GrantPermissionDialogProps> = ({
    dashboardId,
    open,
    onClose,
}) => {
    const { t } = useTranslation();

    const [target, setTarget] = useState<UserOrGroupT | null>(null);
    const [permissionType, setPermissionType] =
        useState<PermissionTypeT | null>(null);

    const [queryParams, updateQueryParams, resetQueryParams] =
        useListQueryParams<ListSelectQueryParams>({ limit: 20, offset: 0 });
    const [autocompleteOpen, setAutocompleteOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [hasMore, setHasMore] = useState(true);

    const permissionOptions: { value: PermissionTypeT; label: string }[] = [
        { value: "view", label: t("permissions.view") },
        { value: "edit", label: t("permissions.edit") },
        { value: "admin", label: t("permissions.admin") },
    ];
    const {
        data,
        isLoading: dataLoading,
        isFetching: dataFetching,
    } = userApi.useListSelectUserOrGroupQuery(queryParams, {
        skip: !autocompleteOpen,
    });

    const [grantPermission, { isLoading }] =
        dashboardApi.useGrantPermissionMutation();

    const handleOpenAutocomplete = () => {
        setAutocompleteOpen(true);
    };

    const debouncedSearch = useCallback(
        debounce((value: string) => {
            resetQueryParams();
            updateQueryParams({
                search: value.length > 0 ? value : undefined,
                offset: 0,
            });
            setHasMore(true);
        }, 300),
        [],
    );

    const handleScroll = (event: React.UIEvent<HTMLUListElement>) => {
        const listboxNode = event.currentTarget;
        if (
            listboxNode.scrollTop + listboxNode.clientHeight >=
                listboxNode.scrollHeight &&
            !dataLoading &&
            hasMore
        ) {
            updateQueryParams({
                offset: queryParams.offset + queryParams.limit,
            });
        }
    };

    const handleSearchInputChange = (_: unknown, value: string) => {
        setSearchQuery(value);
        debouncedSearch(value);
    };

    const handleClickGrant = () => {
        if (!target || !permissionType) return;

        grantPermission({
            dashboard_id: dashboardId,
            target_type: target.type,
            target: target.data.id,
            permission_type: permissionType,
        })
            .unwrap()
            .then(() => {
                onClose();
                setTarget(null);
                setPermissionType(null);
                toast.success(t("dashboards.access.grant.success"));
            })
            .catch(toastApiError);
    };

    const options = data?.payload?.items || [];
    const loading = dataLoading || dataFetching;

    useEffect(() => {
        if (data) {
            const totalItems = data.payload.count || 0;
            const loadedItems = data.payload.items.length || 0;
            setHasMore(loadedItems < totalItems);
        }
    }, [data]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                {t("dashboards.access.grant.title")}
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent
                sx={{ display: "flex", flexDirection: "column", gap: 1 }}
            >
                <Autocomplete
                    sx={{ mt: 1 }}
                    value={target}
                    inputValue={searchQuery}
                    options={options}
                    getOptionLabel={(option) => option.data.name}
                    onOpen={handleOpenAutocomplete}
                    onClose={() => setAutocompleteOpen(false)}
                    onChange={(_, value) => setTarget(value)}
                    onInputChange={handleSearchInputChange}
                    slotProps={{
                        listbox: {
                            onScroll: handleScroll,
                        },
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            placeholder={t("dashboards.access.userOrGroup")}
                            slotProps={{
                                input: {
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {loading ? (
                                                <CircularProgress
                                                    color="inherit"
                                                    size={20}
                                                />
                                            ) : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                },
                            }}
                            size="small"
                        />
                    )}
                    renderOption={(props, option) => {
                        const { key: _, ...optionProps } = props;
                        return (
                            <li {...optionProps} key={option.data.id}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    {option.type === "user" ? (
                                        <UserAvatar
                                            src={
                                                (option.data as BasicUserT)
                                                    .avatar || ""
                                            }
                                        />
                                    ) : (
                                        <GroupIcon />
                                    )}
                                    {option.data.name}
                                    {option.type === "user"
                                        ? ` (${(option.data as BasicUserT).email})`
                                        : null}
                                </Box>
                            </li>
                        );
                    }}
                    groupBy={(option) =>
                        t(`dashboards.access.target.${option.type}s`)
                    }
                    clearOnBlur={false}
                />

                <Autocomplete
                    value={
                        permissionOptions.find(
                            (p) => p.value === permissionType,
                        ) || null
                    }
                    options={permissionOptions}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={t("dashboards.access.permission")}
                            placeholder={t(
                                "dashboards.access.selectPermission",
                            )}
                            size="small"
                        />
                    )}
                    getOptionLabel={(option) => option.label}
                    onChange={(_, value) =>
                        setPermissionType(value?.value || null)
                    }
                />
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="error"
                    size="small"
                    disabled={isLoading}
                >
                    {t("cancel")}
                </Button>

                <Button
                    onClick={handleClickGrant}
                    variant="outlined"
                    size="small"
                    disabled={!target || !permissionType}
                    loading={isLoading}
                >
                    {t("dashboards.access.grant")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

interface RevokePermissionDialogProps {
    open: boolean;
    dashboard: DashboardT;
    permission: PermissionT | null;
    onClose: () => void;
}

const RevokePermissionDialog: FC<RevokePermissionDialogProps> = ({
    open,
    dashboard,
    permission,
    onClose,
}) => {
    const { t } = useTranslation();

    const [revokePermission, { isLoading }] =
        dashboardApi.useRevokePermissionMutation();

    const handleClickRevoke = () => {
        if (!permission) return;

        revokePermission({
            dashboard_id: dashboard.id,
            permission_id: permission.id,
        })
            .unwrap()
            .then(() => {
                toast.success(t("dashboards.access.revoke.success"));
                onClose();
            })
            .catch(toastApiError);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                {t("dashboards.access.revoke.title")}
                <IconButton onClick={onClose} size="small" disabled={isLoading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <DialogContentText>
                    <Typography>
                        {t("dashboards.access.revoke.text")}{" "}
                        {permission?.target?.name}:
                    </Typography>
                    <Typography ml={1}>
                        {permission?.permission_type} {t("in")} {dashboard.name}
                    </Typography>
                </DialogContentText>
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    size="small"
                    color="error"
                    disabled={isLoading}
                >
                    {t("cancel")}
                </Button>

                <Button
                    onClick={handleClickRevoke}
                    variant="outlined"
                    size="small"
                    loading={isLoading}
                >
                    {t("dashboards.access.revoke")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

interface DashboardAccessProps {
    dashboard: DashboardT;
}

export const DashboardAccess: FC<DashboardAccessProps> = ({ dashboard }) => {
    const { t } = useTranslation();

    const [grantPermissionDialogOpen, setGrantPermissionDialogOpen] =
        useState(false);
    const [revokePermissionDialogOpen, setRevokePermissionDialogOpen] =
        useState(false);
    const [selectedPermission, setSelectedPermission] =
        useState<PermissionT | null>(null);

    const [listQueryParams, updateListQueryParams] = useListQueryParams({
        limit: 50,
    });

    const {
        data: permissions,
        isLoading,
        isFetching,
    } = dashboardApi.useGetDashboardPermissionsQuery({
        id: dashboard.id,
        params: listQueryParams,
    });

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
                            setSelectedPermission(row);
                            setRevokePermissionDialogOpen(true);
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
                headerName: t("dashboards.access.target.type"),
                valueGetter: (_, row) =>
                    t(`dashboards.access.target.${row.target_type}`),
                resizable: false,
            },
            {
                field: "target_name",
                headerName: t("dashboards.access.target.name"),
                valueGetter: (_, row) => row.target.name,
                flex: 1,
                renderCell: ({ row }) => (
                    <Box display="flex" alignItems="center" gap={1}>
                        {row.target_type === "user" ? (
                            <UserAvatar
                                src={(row.target as BasicUserT).avatar}
                            />
                        ) : (
                            <GroupIcon />
                        )}
                        {row.target.name}
                        {row.target_type === "user"
                            ? ` (${(row.target as BasicUserT).email})`
                            : null}
                    </Box>
                ),
                resizable: false,
            },
            {
                field: "permission_type",
                headerName: t("dashboards.access.permission"),
                valueGetter: (_, row) =>
                    t(`permissions.${row.permission_type}`),
                flex: 1,
                resizable: false,
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

    const rows = permissions?.payload.items || [];
    const rowCount = permissions?.payload.count || 0;

    return (
        <Box display="flex" flexDirection="column" gap={1} height="486px">
            <Box>
                <Button
                    onClick={() => setGrantPermissionDialogOpen(true)}
                    startIcon={<AddIcon />}
                    variant="outlined"
                    size="small"
                >
                    {t("dashboards.access.grant.title")}
                </Button>
            </Box>

            <DataGrid
                sx={{
                    flex: "1 1 0",
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
                disableRowSelectionOnClick
                disableColumnMenu
            />

            <GrantPermissionDialog
                dashboardId={dashboard.id}
                open={grantPermissionDialogOpen}
                onClose={() => setGrantPermissionDialogOpen(false)}
            />

            <RevokePermissionDialog
                open={revokePermissionDialogOpen}
                dashboard={dashboard}
                permission={selectedPermission}
                onClose={() => setRevokePermissionDialogOpen(false)}
            />
        </Box>
    );
};
