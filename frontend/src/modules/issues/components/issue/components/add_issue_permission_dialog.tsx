import CloseIcon from "@mui/icons-material/Close";
import {
    Autocomplete,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField,
    Typography,
} from "@mui/material";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { issueApi, roleApi, userApi } from "shared/model";
import type {
    IssueT,
    ListQueryParams,
    ListSelectQueryParams,
    RoleT,
    UserOrGroupT,
} from "shared/model/types";
import { toastApiError, useListQueryParams } from "shared/utils";

interface AddIssuePermissionDialogProps {
    issue: IssueT;
    open: boolean;
    onClose: () => void;
}

export const AddIssuePermissionDialog: FC<AddIssuePermissionDialogProps> = ({
    issue,
    open,
    onClose,
}) => {
    const { t } = useTranslation();

    const [selectedTarget, setSelectedTarget] = useState<UserOrGroupT | null>(
        null,
    );
    const [selectedRole, setSelectedRole] = useState<RoleT | null>(null);

    const [
        userGroupQueryParams,
        updateUserGroupQueryParams,
        resetUserGroupQueryParams,
    ] = useListQueryParams<ListSelectQueryParams>({ limit: 20, offset: 0 });
    const [roleQueryParams, updateRoleQueryParams, resetRoleQueryParams] =
        useListQueryParams<ListQueryParams>({ limit: 20, offset: 0 });

    const [userGroupAutocompleteOpen, setUserGroupAutocompleteOpen] =
        useState(false);
    const [roleAutocompleteOpen, setRoleAutocompleteOpen] = useState(false);

    // User-group combined query
    const {
        data: userGroupData,
        isLoading: userGroupLoading,
        isFetching: userGroupFetching,
    } = userApi.useListSelectUserOrGroupQuery(userGroupQueryParams, {
        skip: !userGroupAutocompleteOpen || !open,
    });

    // Role query
    const {
        data: roleData,
        isLoading: rolesLoading,
        isFetching: rolesFetching,
    } = roleApi.useListRoleQuery(roleQueryParams, {
        skip: !roleAutocompleteOpen || !open,
    });

    const [grantIssuePermission, { isLoading }] =
        issueApi.useGrantIssuePermissionMutation();

    const handleOpenUserGroupAutocomplete = () => {
        setUserGroupAutocompleteOpen(true);
    };

    const handleOpenRoleAutocomplete = () => {
        setRoleAutocompleteOpen(true);
    };

    const handleUserGroupSearchInputChange = (_: unknown, value: string) => {
        resetUserGroupQueryParams();
        updateUserGroupQueryParams({
            search: value.length > 0 ? value : undefined,
            offset: 0,
        });
    };

    const handleRoleSearchInputChange = (_: unknown, value: string) => {
        resetRoleQueryParams();
        updateRoleQueryParams({
            search: value.length > 0 ? value : undefined,
            offset: 0,
        });
    };

    const handleClickAdd = async () => {
        if (!selectedTarget || !selectedRole) return;

        try {
            await grantIssuePermission({
                id: issue.id_readable,
                target_type: selectedTarget.type,
                target_id: selectedTarget.data.id,
                role_id: selectedRole.id,
            }).unwrap();

            handleClose();
        } catch (error) {
            toastApiError(error);
        }
    };

    const handleClose = () => {
        onClose();
        setSelectedTarget(null);
        setSelectedRole(null);
        resetUserGroupQueryParams();
        resetRoleQueryParams();
    };

    const userGroupOptions = userGroupData?.payload?.items || [];
    const isUserGroupLoading = userGroupLoading || userGroupFetching;
    const roleOptions = roleData?.payload?.items || [];
    const roleLoading = rolesLoading || rolesFetching;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Typography variant="h6">
                        {t("projects.access.grantPermission")}
                    </Typography>
                    <IconButton onClick={handleClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Box
                    display="flex"
                    flexDirection="column"
                    gap={3}
                    sx={{ pt: 1 }}
                >
                    {/* User/Group Selection */}
                    <Autocomplete
                        options={userGroupOptions}
                        getOptionLabel={(option) => option.data.name}
                        value={selectedTarget}
                        onChange={(_, newValue) => setSelectedTarget(newValue)}
                        onOpen={handleOpenUserGroupAutocomplete}
                        onClose={() => setUserGroupAutocompleteOpen(false)}
                        onInputChange={handleUserGroupSearchInputChange}
                        loading={isUserGroupLoading}
                        groupBy={(option) =>
                            option.type === "user"
                                ? t("projects.access.target.users")
                                : t("projects.access.target.groups")
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={t("projects.access.selectUserOrGroup")}
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {userGroupLoading ? (
                                                <CircularProgress size={20} />
                                            ) : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                    />

                    {/* Role Selection */}
                    <Autocomplete
                        options={roleOptions}
                        getOptionLabel={(option) => option.name}
                        value={selectedRole}
                        onChange={(_, newValue) => setSelectedRole(newValue)}
                        onOpen={handleOpenRoleAutocomplete}
                        onClose={() => setRoleAutocompleteOpen(false)}
                        onInputChange={handleRoleSearchInputChange}
                        loading={roleLoading}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={t("projects.access.selectRole")}
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {roleLoading ? (
                                                <CircularProgress size={20} />
                                            ) : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                    />
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose}>{t("cancel")}</Button>
                <Button
                    onClick={handleClickAdd}
                    variant="contained"
                    disabled={!selectedTarget || !selectedRole || isLoading}
                >
                    {isLoading ? (
                        <CircularProgress size={20} />
                    ) : (
                        t("projects.access.grant")
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
