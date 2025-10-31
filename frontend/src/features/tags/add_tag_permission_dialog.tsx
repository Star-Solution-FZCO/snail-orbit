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
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
} from "@mui/material";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { tagApi, userApi } from "shared/model";
import type {
    BasicUserT,
    ListSelectQueryParams,
    PermissionTargetTypeT,
    PermissionTypeT,
    TagT,
    UserOrGroupT,
} from "shared/model/types";
import { UserAvatar } from "shared/ui";
import { toastApiError, useListQueryParams } from "shared/utils";

interface AddTagPermissionDialogProps {
    tag: TagT;
    open: boolean;
    onClose: () => void;
}

export const AddTagPermissionDialog: FC<AddTagPermissionDialogProps> = ({
    tag,
    open,
    onClose,
}) => {
    const { t } = useTranslation();

    const [selectedTarget, setSelectedTarget] = useState<UserOrGroupT | null>(
        null,
    );
    const [selectedPermissionType, setSelectedPermissionType] =
        useState<PermissionTypeT>("view");

    const [
        userGroupQueryParams,
        updateUserGroupQueryParams,
        resetUserGroupQueryParams,
    ] = useListQueryParams<ListSelectQueryParams>({ limit: 20, offset: 0 });

    const [userGroupAutocompleteOpen, setUserGroupAutocompleteOpen] =
        useState(false);

    const {
        data: userGroupData,
        isLoading: userGroupLoading,
        isFetching: userGroupFetching,
    } = userApi.useListSelectUserOrGroupQuery(userGroupQueryParams, {
        skip: !userGroupAutocompleteOpen || !open,
    });

    const [grantTagPermission, { isLoading }] =
        tagApi.useGrantTagPermissionMutation();

    const handleOpenUserGroupAutocomplete = () => {
        setUserGroupAutocompleteOpen(true);
    };

    const handleUserGroupSearchInputChange = (_: unknown, value: string) => {
        resetUserGroupQueryParams();
        updateUserGroupQueryParams({
            search: value.length > 0 ? value : undefined,
            offset: 0,
        });
    };

    const handleClickAdd = async () => {
        if (!selectedTarget) return;

        try {
            await grantTagPermission({
                tagId: tag.id,
                target_type: selectedTarget.type as PermissionTargetTypeT,
                target: selectedTarget.data.id,
                permission_type: selectedPermissionType,
            }).unwrap();

            handleClose();
        } catch (error) {
            toastApiError(error);
        }
    };

    const handleClose = () => {
        onClose();
        setSelectedTarget(null);
        setSelectedPermissionType("view");
        resetUserGroupQueryParams();
    };

    const userGroupOptions = userGroupData?.payload?.items || [];
    const isUserGroupLoading = userGroupLoading || userGroupFetching;

    const permissionTypes: PermissionTypeT[] = ["view", "edit", "admin"];

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                {t("tags.access.permission.grant.title", {
                    tagName: tag.name,
                })}

                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <Stack gap={1} mt={1}>
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
                                ? t("tags.access.target.users")
                                : t("tags.access.target.groups")
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={t("tags.access.selectUserOrGroup")}
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
                                                {params.InputProps.endAdornment}
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
                                                    (option.data as BasicUserT)
                                                        .avatar || ""
                                                }
                                                isBot={
                                                    (option.data as BasicUserT)
                                                        .is_bot
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
                    />

                    <FormControl size="small" fullWidth>
                        <InputLabel>{t("tags.access.permission")}</InputLabel>
                        <Select
                            value={selectedPermissionType}
                            onChange={(e) =>
                                setSelectedPermissionType(
                                    e.target.value as PermissionTypeT,
                                )
                            }
                            label={t("tags.access.permission")}
                        >
                            {permissionTypes.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {t(`permissions.${type}`)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={handleClose}
                    size="small"
                    variant="outlined"
                    color="error"
                >
                    {t("cancel")}
                </Button>

                <Button
                    onClick={handleClickAdd}
                    size="small"
                    variant="outlined"
                    disabled={!selectedTarget || isLoading}
                >
                    {t("tags.access.grant")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
