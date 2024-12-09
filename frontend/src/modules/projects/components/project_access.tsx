import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupIcon from "@mui/icons-material/Group";
import { LoadingButton } from "@mui/lab";
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
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { UserAvatar } from "components";
import { FC, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { groupApi, projectApi, roleApi, userApi } from "store";
import {
    BasicUserT,
    ListSelectQueryParams,
    ProjectDetailT,
    ProjectPermissionT,
    ProjectPermissionTargetT,
    RoleT,
    TargetTypeT,
} from "types";
import {
    noLimitListQueryParams,
    toastApiError,
    useListQueryParams,
} from "utils";
import { mergeUsersAndGroups } from "../utils";

interface IPGrantPermissionDialogProps {
    projectId: string;
    open: boolean;
    onClose: () => void;
}

const GrantPermissionDialog: FC<IPGrantPermissionDialogProps> = ({
    projectId,
    open,
    onClose,
}) => {
    const { t } = useTranslation();

    const [target, setTarget] = useState<
        | (ProjectPermissionTargetT & { type: TargetTypeT; avatar?: string })
        | null
    >(null);
    const [role, setRole] = useState<RoleT | null>(null);

    const [queryParams, updateQueryParams, resetQueryParams] =
        useListQueryParams<ListSelectQueryParams>({ limit: 20, offset: 0 });
    const [autocompleteOpen, setAutocompleteOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const { data: roles } = roleApi.useListRoleQuery(noLimitListQueryParams);
    const {
        data: users,
        isLoading: usersLoading,
        isFetching: usersFetching,
    } = userApi.useListSelectUserQuery(queryParams, {
        skip: !autocompleteOpen,
    });

    const {
        data: groups,
        isLoading: groupsLoading,
        isFetching: groupsFetching,
    } = groupApi.useListGroupQuery(queryParams, { skip: !autocompleteOpen });

    const [grantProjectPermission, { isLoading }] =
        projectApi.useGrantProjectPermissionMutation();

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
        }, 300),
        [],
    );

    const handleScroll = (event: React.UIEvent<HTMLUListElement>) => {
        const listboxNode = event.currentTarget;
        if (
            listboxNode.scrollTop + listboxNode.clientHeight >=
                listboxNode.scrollHeight &&
            !dataLoading
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
        if (!target || !role) return;

        grantProjectPermission({
            id: projectId,
            target_type: target.type,
            target_id: target.id,
            role_id: role.id,
        })
            .unwrap()
            .then(() => {
                onClose();
                setTarget(null);
                setRole(null);
                toast.success(t("projects.access.grant.success"));
            })
            .catch(toastApiError);
    };

    const usersAndGroups = mergeUsersAndGroups(
        users?.payload.items || [],
        groups?.payload.items || [],
    );

    const dataLoading =
        usersLoading || usersFetching || groupsLoading || groupsFetching;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                {t("projects.access.grantPermission")}
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
                <Autocomplete
                    sx={{ mt: 1 }}
                    value={role}
                    options={roles?.payload.items || []}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={t("projects.access.role")}
                            placeholder={t("projects.access.selectRole")}
                            size="small"
                        />
                    )}
                    getOptionLabel={(option) => option.name}
                    onChange={(_, value) => setRole(value)}
                />

                <Autocomplete
                    value={target}
                    inputValue={searchQuery}
                    options={usersAndGroups}
                    getOptionLabel={(option) => option.name}
                    onOpen={handleOpenAutocomplete}
                    onChange={(_, value) => setTarget(value)}
                    onInputChange={handleSearchInputChange}
                    ListboxProps={{
                        onScroll: handleScroll,
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            placeholder={t("projects.access.userOrGroup")}
                            slotProps={{
                                input: {
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {dataLoading ? (
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
                        const { key, ...optionProps } = props;
                        return (
                            <li key={key} {...optionProps}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    {option.type === "user" ? (
                                        <UserAvatar src={option.avatar || ""} />
                                    ) : (
                                        <GroupIcon />
                                    )}
                                    {option.name}
                                </Box>
                            </li>
                        );
                    }}
                    groupBy={(option) =>
                        t(`projects.access.target.${option.type}s`)
                    }
                />
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="error"
                    disabled={isLoading}
                >
                    {t("cancel")}
                </Button>

                <LoadingButton
                    onClick={handleClickGrant}
                    variant="outlined"
                    disabled={!target || !role}
                    loading={isLoading}
                >
                    {t("projects.access.grant")}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

interface IRevokeProjectPermissionDialogProps {
    open: boolean;
    project: ProjectDetailT;
    permission: ProjectPermissionT | null;
    onClose: () => void;
}

const RevokProjectPermissionDialog: FC<IRevokeProjectPermissionDialogProps> = ({
    open,
    project,
    permission,
    onClose,
}) => {
    const { t } = useTranslation();

    const [revokeProjectPermission, { isLoading }] =
        projectApi.useRevokeProjectPermissionMutation();

    const handleClickRevoke = () => {
        if (!permission) return;

        revokeProjectPermission({
            id: project.id,
            permissionId: permission.id,
        })
            .unwrap()
            .then(() => {
                toast.success(t("projects.access.permissions.revoke.success"));
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
                {t("projects.access.permissions.revoke.title")}?
                <IconButton onClick={onClose} size="small" disabled={isLoading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <DialogContentText>
                    <Typography>
                        {t("projects.access.permissions.revoke.text")}{" "}
                        {permission?.target?.name}:
                    </Typography>
                    <Typography ml={1}>
                        {permission?.role?.name} {t("in")} {project.name}
                    </Typography>
                </DialogContentText>
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="error"
                    disabled={isLoading}
                >
                    {t("cancel")}
                </Button>

                <LoadingButton
                    onClick={handleClickRevoke}
                    variant="outlined"
                    loading={isLoading}
                >
                    {t("projects.access.permissions.revoke")}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

interface IProjectAccessProps {
    project: ProjectDetailT;
}

const ProjectAccess: FC<IProjectAccessProps> = ({ project }) => {
    const { t } = useTranslation();

    const [grantPermissionDialogOpen, setGrantPermissionDialogOpen] =
        useState(false);
    const [revokePermissionDialogOpen, setRevokePermissionDialogOpen] =
        useState(false);
    const [selectedPermission, setSelectedPermission] =
        useState<ProjectPermissionT | null>(null);

    const [listQueryParams, updateListQueryParams] = useListQueryParams({
        limit: 50,
    });

    const {
        data: permissions,
        isLoading,
        isFetching,
    } = projectApi.useGetProjectPermissionsQuery({
        id: project.id,
        params: listQueryParams,
    });

    const columns: GridColDef<ProjectPermissionT>[] = useMemo(
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
                field: "target_name",
                headerName: t("projects.access.target.name"),
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
                    </Box>
                ),
            },
            {
                field: "target_type",
                headerName: t("projects.access.target.type"),
                valueGetter: (_, row) =>
                    t(`projects.access.target.${row.target_type}`),
                flex: 1,
            },
            {
                field: "role",
                headerName: t("projects.access.role"),
                valueGetter: (_, row) => row.role.name,
                flex: 1,
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
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <Box>
                <Button
                    onClick={() => setGrantPermissionDialogOpen(true)}
                    startIcon={<AddIcon />}
                    variant="outlined"
                    size="small"
                >
                    {t("projects.access.grantPermission")}
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

            <GrantPermissionDialog
                projectId={project.id}
                open={grantPermissionDialogOpen}
                onClose={() => setGrantPermissionDialogOpen(false)}
            />

            <RevokProjectPermissionDialog
                open={revokePermissionDialogOpen}
                project={project}
                permission={selectedPermission}
                onClose={() => setRevokePermissionDialogOpen(false)}
            />
        </Box>
    );
};

export { ProjectAccess };
