import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import { LoadingButton } from "@mui/lab";
import {
    Autocomplete,
    Box,
    Button,
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
import { FC, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { groupApi, projectApi, roleApi, userApi } from "store";
import {
    ProjectDetailT,
    ProjectPermissionT,
    ProjectPermissionTargetT,
    RoleT,
    TargetTypeT,
} from "types";
import { toastApiError, useListQueryParams } from "utils";
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
        (ProjectPermissionTargetT & { type: TargetTypeT }) | null
    >(null);
    const [role, setRole] = useState<RoleT | null>(null);

    const { data: roles } = roleApi.useListRoleQuery({
        limit: 0,
        offset: 0,
    });
    const { data: users } = userApi.useListUserQuery({ limit: 0, offset: 0 });
    const { data: groups } = groupApi.useListGroupQuery({
        limit: 0,
        offset: 0,
    });

    const [grantProjectPermission, { isLoading }] =
        projectApi.useGrantProjectPermissionMutation();

    const handleClose = () => {
        onClose();
        setTarget(null);
        setRole(null);
    };

    const handleClickGrant = () => {
        if (!target || !role) {
            return;
        }

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

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {t("projects.access.grantPermission")}

                <IconButton sx={{ p: 0 }} onClick={handleClose} size="small">
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
                    options={usersAndGroups}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={t("projects.access.userOrGroup")}
                            placeholder={t("projects.access.selectUserOrGroup")}
                            size="small"
                        />
                    )}
                    getOptionLabel={(option) => option.name}
                    onChange={(_, value) => setTarget(value)}
                    groupBy={(option) =>
                        t(`projects.access.target.${option.type}s`)
                    }
                />
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} variant="outlined" color="error">
                    {t("cancel")}
                </Button>

                <LoadingButton
                    onClick={handleClickGrant}
                    loading={isLoading}
                    disabled={!target || !role}
                    variant="outlined"
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
                <IconButton
                    sx={{ p: 0 }}
                    onClick={onClose}
                    size="small"
                    disabled={isLoading}
                >
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
