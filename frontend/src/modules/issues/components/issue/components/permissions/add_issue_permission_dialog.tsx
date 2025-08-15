import CloseIcon from "@mui/icons-material/Close";
import GroupIcon from "@mui/icons-material/Group";
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
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { issueApi, roleApi, userApi } from "shared/model";
import type {
    BasicUserT,
    IssueT,
    ListQueryParams,
    ListSelectQueryParams,
    RoleT,
    UserOrGroupT,
} from "shared/model/types";
import { UserAvatar } from "shared/ui";
import { toastApiError, useListQueryParams } from "shared/utils";
import { IssueRolePermissions } from "./issue_role_permissions";

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

    const {
        data: userGroupData,
        isLoading: userGroupLoading,
        isFetching: userGroupFetching,
    } = userApi.useListSelectUserOrGroupQuery(userGroupQueryParams, {
        skip: !userGroupAutocompleteOpen || !open,
    });

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

    const handleClose = () => {
        onClose();
        setSelectedTarget(null);
        setSelectedRole(null);
        resetUserGroupQueryParams();
        resetRoleQueryParams();
    };

    const handleClickAdd = async () => {
        if (!selectedTarget || !selectedRole) return;

        grantIssuePermission({
            id: issue.id_readable,
            target_type: selectedTarget.type,
            target_id: selectedTarget.data.id,
            role_id: selectedRole.id,
        })
            .unwrap()
            .then(() => {
                handleClose();
            })
            .catch(toastApiError);
    };

    const userGroupOptions = userGroupData?.payload?.items || [];
    const isUserGroupLoading = userGroupLoading || userGroupFetching;
    const roleOptions = roleData?.payload?.items || [];
    const roleLoading = rolesLoading || rolesFetching;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                {t("issues.access.permission.grant", {
                    issueId: issue.id_readable,
                })}

                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <Stack direction="row" mt={1} gap={1}>
                    <Stack gap={1} flex={1}>
                        <Autocomplete
                            options={userGroupOptions}
                            getOptionLabel={(option) => option.data.name}
                            value={selectedTarget}
                            onChange={(_, newValue) =>
                                setSelectedTarget(newValue)
                            }
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
                                    label={t(
                                        "projects.access.selectUserOrGroup",
                                    )}
                                    size="small"
                                    slotProps={{
                                        input: {
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {userGroupLoading ? (
                                                        <CircularProgress
                                                            size={20}
                                                        />
                                                    ) : null}
                                                    {
                                                        params.InputProps
                                                            .endAdornment
                                                    }
                                                </>
                                            ),
                                        },
                                    }}
                                />
                            )}
                            renderOption={(props, option) => {
                                const { key: _, ...optionProps } = props;
                                return (
                                    <li {...optionProps} key={option.data.id}>
                                        <Box
                                            display="flex"
                                            alignItems="center"
                                            gap={1}
                                        >
                                            {option.type === "user" ? (
                                                <UserAvatar
                                                    src={
                                                        (
                                                            option.data as BasicUserT
                                                        ).avatar || ""
                                                    }
                                                />
                                            ) : (
                                                <GroupIcon />
                                            )}
                                            {option.data.name}{" "}
                                            {option.type === "user"
                                                ? `(${(option.data as BasicUserT).email})`
                                                : null}
                                        </Box>
                                    </li>
                                );
                            }}
                        />

                        <Autocomplete
                            options={roleOptions}
                            getOptionLabel={(option) => option.name}
                            value={selectedRole}
                            onChange={(_, newValue) =>
                                setSelectedRole(newValue)
                            }
                            onOpen={handleOpenRoleAutocomplete}
                            onClose={() => setRoleAutocompleteOpen(false)}
                            onInputChange={handleRoleSearchInputChange}
                            loading={roleLoading}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t("projects.access.selectRole")}
                                    size="small"
                                    slotProps={{
                                        input: {
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {roleLoading ? (
                                                        <CircularProgress
                                                            size={20}
                                                        />
                                                    ) : null}
                                                    {
                                                        params.InputProps
                                                            .endAdornment
                                                    }
                                                </>
                                            ),
                                        },
                                    }}
                                />
                            )}
                        />
                    </Stack>

                    <Stack
                        flex={1}
                        maxHeight="400px"
                        overflow="auto"
                        borderLeft={1}
                        borderColor="divider"
                        pl={1}
                    >
                        {selectedRole ? (
                            <IssueRolePermissions role={selectedRole} />
                        ) : (
                            <Typography
                                variant="subtitle2"
                                color="textSecondary"
                                textAlign="center"
                            >
                                {t("issues.access.noSelectedRole")}
                            </Typography>
                        )}
                    </Stack>
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    size="small"
                    color="error"
                >
                    {t("cancel")}
                </Button>

                <Button
                    onClick={handleClickAdd}
                    variant="outlined"
                    size="small"
                    disabled={!selectedTarget || !selectedRole}
                    loading={isLoading}
                >
                    {t("issues.access.grant")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
