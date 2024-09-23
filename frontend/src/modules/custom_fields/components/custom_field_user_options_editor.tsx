import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupIcon from "@mui/icons-material/Group";
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
import { UserAvatar } from "components";
import { mergeUsersAndGroups } from "modules/projects/utils";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { customFieldsApi, groupApi, userApi } from "store";
import { BasicUserT, CustomFieldT, UserOrGroupOptionT } from "types";
import { toastApiError } from "utils";

interface IUserOrGroupOptionProps {
    entity: UserOrGroupOptionT;
    onDelete: (entity: UserOrGroupOptionT) => void;
}

const UserOrGroupOption: FC<IUserOrGroupOptionProps> = ({
    entity,
    onDelete,
}) => {
    return (
        <Box display="flex" alignItems="center" gap={1}>
            {entity.type === "user" && (
                <UserAvatar src={(entity.value as BasicUserT).avatar} />
            )}
            {entity.type === "group" && <GroupIcon />}

            <Typography flex={1}>{entity.value.name}</Typography>

            <IconButton
                onClick={() => onDelete(entity)}
                size="small"
                color="error"
            >
                <DeleteIcon />
            </IconButton>
        </Box>
    );
};

interface IAddUserOrGroupDialogProps {
    customFieldId: string;
    open: boolean;
    onClose: () => void;
}

const AddUserDialog: FC<IAddUserOrGroupDialogProps> = ({
    customFieldId,
    open,
    onClose,
}) => {
    const { t } = useTranslation();

    const [entity, setEntity] = useState<{
        id: string;
        name: string;
        type: "user" | "group";
        avatar?: string;
    } | null>(null);

    const { data: users } = userApi.useListSelectUserQuery({
        limit: 0,
        offset: 0,
    });
    const { data: groups } = groupApi.useListGroupQuery({
        limit: 0,
        offset: 0,
    });

    const [addEntity, { isLoading }] =
        customFieldsApi.useCreateCustomFieldUserOptionMutation();

    const handleClose = () => {
        onClose();
        setEntity(null);
    };

    const handleClickAdd = () => {
        if (!entity) {
            return;
        }

        addEntity({
            id: customFieldId,
            type: entity.type,
            value: entity.id,
        })
            .unwrap()
            .then(() => {
                onClose();
                setEntity(null);
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
                {t("customFields.userOrGroup.add.title")}

                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <Autocomplete
                    sx={{ mt: 1 }}
                    value={entity}
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
                    onChange={(_, value) => setEntity(value)}
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
                <Button onClick={handleClose} variant="outlined" color="error">
                    {t("cancel")}
                </Button>

                <LoadingButton
                    onClick={handleClickAdd}
                    loading={isLoading}
                    disabled={!entity}
                    variant="outlined"
                >
                    {t("customFields.userOrGroup.add")}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

interface IRemoveUserOrGroupDialogProps {
    open: boolean;
    customFieldId: string;
    entity: UserOrGroupOptionT | null;
    onClose: () => void;
}

const RemoveUserOrGroupDialog: FC<IRemoveUserOrGroupDialogProps> = ({
    open,
    customFieldId,
    entity,
    onClose,
}) => {
    const { t } = useTranslation();

    const [removeEntity, { isLoading }] =
        customFieldsApi.useDeleteCustomFieldUserOptionMutation();

    const handleClickDelete = () => {
        if (!entity) {
            return;
        }

        removeEntity({
            id: customFieldId,
            option_id: entity.uuid,
        })
            .unwrap()
            .then(onClose)
            .catch(toastApiError);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                {t("customFields.userOrGroup.delete.title")}

                <IconButton onClick={onClose} size="small" disabled={isLoading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <DialogContentText>
                    {t("customFields.userOrGroup.delete.confirmation")}
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
                    onClick={handleClickDelete}
                    variant="outlined"
                    loading={isLoading}
                >
                    {t("delete")}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

interface ICustomFieldOptionsEditorProps {
    customField: CustomFieldT;
}

const CustomFieldUserOptionsEditor: FC<ICustomFieldOptionsEditorProps> = ({
    customField,
}) => {
    const { t } = useTranslation();

    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [selectedEntity, setSelectedEntity] =
        useState<UserOrGroupOptionT | null>(null);

    const handleClickAddUserOrGroup = () => {
        setAddDialogOpen(true);
    };

    const handleClickDeleteUserOrGroup = (user: UserOrGroupOptionT) => {
        setSelectedEntity(user);
        setDeleteDialogOpen(true);
    };

    const users = customField.options || [];

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
                <Typography fontSize={20} fontWeight="bold" lineHeight={1.8}>
                    {t("customFields.userOrGroup.title")}
                </Typography>

                <IconButton onClick={handleClickAddUserOrGroup} size="small">
                    <AddIcon />
                </IconButton>
            </Box>

            {users.length === 0 && (
                <Typography>{t("customFields.userOrGroup.empty")}</Typography>
            )}

            {users.map((user) => (
                <UserOrGroupOption
                    key={user.uuid}
                    entity={user as unknown as UserOrGroupOptionT}
                    onDelete={handleClickDeleteUserOrGroup}
                />
            ))}

            <AddUserDialog
                open={addDialogOpen}
                customFieldId={customField.id}
                onClose={() => setAddDialogOpen(false)}
            />

            <RemoveUserOrGroupDialog
                open={deleteDialogOpen}
                customFieldId={customField.id}
                entity={selectedEntity}
                onClose={() => setDeleteDialogOpen(false)}
            />
        </Box>
    );
};

export { CustomFieldUserOptionsEditor };
