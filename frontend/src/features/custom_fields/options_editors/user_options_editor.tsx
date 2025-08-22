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
import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { customFieldsApi, userApi } from "shared/model";
import type {
    BasicUserT,
    CustomFieldT,
    ListSelectQueryParams,
    UserOrGroupOptionT,
    UserOrGroupT,
    UserT,
} from "shared/model/types";
import { UserAvatar } from "shared/ui";
import { toastApiError, useListQueryParams } from "shared/utils";

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

    const [entity, setEntity] = useState<UserOrGroupT | null>(null);

    const [queryParams, updateQueryParams, resetQueryParams] =
        useListQueryParams<ListSelectQueryParams>({ limit: 20, offset: 0 });

    const [autocompleteOpen, setAutocompleteOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [hasMore, setHasMore] = useState(true);

    const {
        data,
        isLoading: dataLoading,
        isFetching: dataFetching,
    } = userApi.useListSelectUserOrGroupQuery(queryParams, {
        skip: !autocompleteOpen,
    });

    const [addEntity, { isLoading }] =
        customFieldsApi.useCreateCustomFieldUserOptionMutation();

    const handleClose = () => {
        onClose();
        setEntity(null);
    };

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

    const handleClickAdd = () => {
        if (!entity) {
            return;
        }

        addEntity({
            id: customFieldId,
            type: entity.type,
            value: entity.data.id,
        })
            .unwrap()
            .then(() => {
                onClose();
                setEntity(null);
                setSearchQuery("");
                resetQueryParams();
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
                    inputValue={searchQuery}
                    options={options}
                    onOpen={handleOpenAutocomplete}
                    onClose={() => setAutocompleteOpen(false)}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={t("customFields.userOrGroup.title")}
                            placeholder={t("customFields.userOrGroup.select")}
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
                    getOptionLabel={(option) => option.data.name}
                    onChange={(_, value) => setEntity(value)}
                    onInputChange={handleSearchInputChange}
                    ListboxProps={{
                        onScroll: handleScroll,
                    }}
                    renderOption={(props, option) => {
                        const { key: _, ...optionProps } = props;
                        return (
                            <li {...optionProps} key={option.data.id}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    {option.type === "user" ? (
                                        <UserAvatar
                                            src={
                                                (option.data as UserT).avatar ||
                                                ""
                                            }
                                        />
                                    ) : (
                                        <GroupIcon />
                                    )}
                                    {option.data.name}
                                </Box>
                            </li>
                        );
                    }}
                    groupBy={(option) =>
                        t(`projects.access.target.${option.type}s`)
                    }
                    clearOnBlur={false}
                />
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} variant="outlined" color="error">
                    {t("cancel")}
                </Button>

                <Button
                    onClick={handleClickAdd}
                    loading={isLoading}
                    disabled={!entity}
                    variant="outlined"
                >
                    {t("customFields.userOrGroup.add")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

interface IRemoveUserOrGroupDialogProps {
    open: boolean;
    onClose: () => void;
    onDelete: () => void;
    loading?: boolean;
}

const RemoveUserOrGroupDialog: FC<IRemoveUserOrGroupDialogProps> = ({
    open,
    onClose,
    onDelete,
    loading,
}) => {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                {t("customFields.userOrGroup.delete.title")}

                <IconButton onClick={onClose} size="small" disabled={loading}>
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
                    disabled={loading}
                >
                    {t("cancel")}
                </Button>

                <Button onClick={onDelete} variant="outlined" loading={loading}>
                    {t("delete")}
                </Button>
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

    const [removeEntity, { isLoading }] =
        customFieldsApi.useDeleteCustomFieldUserOptionMutation();

    const deleteOption = () => {
        if (!selectedEntity) {
            return;
        }

        removeEntity({
            id: customField.id,
            option_id: selectedEntity.uuid,
        })
            .unwrap()
            .then(() => {
                setDeleteDialogOpen(false);
                setSelectedEntity(null);
            })
            .catch(toastApiError);
    };

    const users = "options" in customField ? customField.options : [];

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
                <Typography fontSize={20} fontWeight="bold" lineHeight={1.8}>
                    {t("customFields.usersAndGroups.title")}
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
                onClose={() => setDeleteDialogOpen(false)}
                onDelete={deleteOption}
                loading={isLoading}
            />
        </Box>
    );
};

export { CustomFieldUserOptionsEditor };
