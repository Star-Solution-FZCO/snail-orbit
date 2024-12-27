import CloseIcon from "@mui/icons-material/Close";
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
    DialogTitle,
    IconButton,
    TextField,
} from "@mui/material";
import { UserAvatar } from "components";
import { FC, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { groupApi, userApi } from "store";
import { BasicUserT, ListSelectQueryParams } from "types";
import { toastApiError, useListQueryParams } from "utils";

interface AddGroupMemberDialogProps {
    groupId: string;
    open: boolean;
    onClose: () => void;
}

export const AddGroupMemberDialog: FC<AddGroupMemberDialogProps> = ({
    groupId,
    open,
    onClose,
}) => {
    const { t } = useTranslation();

    const [user, setUser] = useState<BasicUserT | null>(null);

    const [queryParams, updateQueryParams, resetQueryParams] =
        useListQueryParams<ListSelectQueryParams>({ limit: 20, offset: 0 });
    const [autocompleteOpen, setAutocompleteOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [hasMore, setHasMore] = useState(true);

    const {
        data,
        isLoading: usersLoading,
        isFetching: usersFetching,
    } = userApi.useListSelectUserQuery(queryParams, {
        skip: !autocompleteOpen,
    });

    const [addGroupMember, { isLoading }] =
        groupApi.useAddGroupMemberMutation();

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
        if (!user) return;

        addGroupMember({ id: groupId, userId: user.id })
            .unwrap()
            .then(() => {
                onClose();
                setUser(null);
            })
            .catch(toastApiError);
    };

    const users = data?.payload?.items || [];
    const dataLoading = usersLoading || usersFetching;

    useEffect(() => {
        if (data) {
            const totalItems = data.payload.count || 0;
            const loadedItems = data.payload.items.length || 0;
            setHasMore(loadedItems < totalItems);
        }
    }, [data]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                {t("groups.members.add")}

                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent
                sx={{ display: "flex", flexDirection: "column", gap: 1 }}
            >
                <Autocomplete
                    value={user}
                    inputValue={searchQuery}
                    options={users}
                    getOptionLabel={(option) => option.name}
                    onOpen={handleOpenAutocomplete}
                    onClose={() => setAutocompleteOpen(false)}
                    onChange={(_, value) => setUser(value)}
                    onInputChange={handleSearchInputChange}
                    ListboxProps={{
                        onScroll: handleScroll,
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            placeholder={t("groups.members.filter")}
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
                        const { key, ...optionProps } = props;
                        return (
                            <li {...optionProps} key={option.id}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <UserAvatar src={option.avatar} />
                                    {option.name}
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

                <LoadingButton
                    onClick={handleClickAdd}
                    variant="outlined"
                    disabled={!user}
                    loading={isLoading}
                >
                    {t("groups.members.add")}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};
