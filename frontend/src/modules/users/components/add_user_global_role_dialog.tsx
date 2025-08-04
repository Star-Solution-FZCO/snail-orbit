import CloseIcon from "@mui/icons-material/Close";
import {
    Autocomplete,
    Box,
    Button,
    CircularProgress,
    debounce,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField,
    Typography,
} from "@mui/material";
import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { globalRoleApi, userApi } from "shared/model";
import type {
    GlobalRoleSimpleT,
    ListSelectQueryParams,
} from "shared/model/types";
import { toastApiError, useListQueryParams } from "shared/utils";

interface AddUserGlobalRoleDialogProps {
    userId: string;
    open: boolean;
    onClose: () => void;
}

export const AddUserGlobalRoleDialog: FC<AddUserGlobalRoleDialogProps> = ({
    userId,
    open,
    onClose,
}) => {
    const { t } = useTranslation();

    const [role, setRole] = useState<GlobalRoleSimpleT | null>(null);

    const [queryParams, updateQueryParams, resetQueryParams] =
        useListQueryParams<ListSelectQueryParams>({ limit: 20, offset: 0 });
    const [autocompleteOpen, setAutocompleteOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [hasMore, setHasMore] = useState(true);

    const {
        data,
        isLoading: rolesLoading,
        isFetching: rolesFetching,
    } = globalRoleApi.useListSelectGlobalRoleQuery(queryParams, {
        skip: !autocompleteOpen,
    });

    const [assignGlobalRoleToUser, { isLoading }] =
        userApi.useAssignGlobalRoleToUserMutation();

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
        if (!role) return;

        assignGlobalRoleToUser({ userId, roleId: role.id })
            .unwrap()
            .then(() => {
                onClose();
                setRole(null);
            })
            .catch(toastApiError);
    };

    const roles = data?.payload?.items || [];
    const dataLoading = rolesLoading || rolesFetching;

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
                {t("users.globalRoles.add")}

                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent
                sx={{ display: "flex", flexDirection: "column", gap: 1 }}
            >
                <Autocomplete
                    value={role}
                    inputValue={searchQuery}
                    options={roles}
                    getOptionLabel={(option) => option.name}
                    onOpen={handleOpenAutocomplete}
                    onClose={() => setAutocompleteOpen(false)}
                    onChange={(_, value) => setRole(value)}
                    onInputChange={handleSearchInputChange}
                    ListboxProps={{
                        onScroll: handleScroll,
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            placeholder={t("users.globalRoles.filter")}
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
                        />
                    )}
                    renderOption={(props, option) => {
                        const { key: _, ...optionProps } = props;
                        return (
                            <li {...optionProps} key={option.id}>
                                <Box
                                    display="flex"
                                    flexDirection="column"
                                    gap={0.5}
                                >
                                    <Typography
                                        variant="body2"
                                        fontWeight="medium"
                                    >
                                        {option.name}
                                    </Typography>
                                    {option.description && (
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {option.description}
                                        </Typography>
                                    )}
                                </Box>
                            </li>
                        );
                    }}
                    size="small"
                    clearOnBlur={false}
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

                <Button
                    onClick={handleClickAdd}
                    variant="outlined"
                    disabled={!role}
                    loading={isLoading}
                >
                    {t("users.globalRoles.add")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
