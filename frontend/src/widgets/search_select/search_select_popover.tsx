import EditIcon from "@mui/icons-material/Edit";
import type { AutocompleteChangeReason } from "@mui/material";
import { Button, IconButton } from "@mui/material";
import { skipToken } from "@reduxjs/toolkit/query";
import { FormAutocompletePopover } from "components/fields/form_autocomplete/form_autocomplete";
import type { SyntheticEvent } from "react";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { searchApi } from "store/api/search.api";
import type { SearchFormValuesT, SearchT } from "types/search";
import { toastApiError, useListQueryParams } from "utils";
import useDebouncedState from "utils/hooks/use-debounced-state";
import type { EditSearchDialogValues } from "./edit_search_dialog";
import { EditSearchDialog } from "./edit_search_dialog";
import { formValuesToCreateValues } from "./search_select.utils";

type SearchSelectPopoverProps = {
    value?: SearchT | SearchT[];
    onChange?: (
        event: SyntheticEvent,
        value: SearchT | SearchT[] | null,
        reason: AutocompleteChangeReason,
    ) => void;
    open: boolean;
    anchorEl?: Element | null;
    multiple?: boolean;
    onClose?: () => unknown;
    initialQueryString?: string;
};

export const SearchSelectPopover = (props: SearchSelectPopoverProps) => {
    const { t } = useTranslation();
    const {
        open,
        anchorEl,
        multiple,
        onClose,
        onChange,
        value,
        initialQueryString,
    } = props;

    const [editSearchValue, setEditSearchValue] = useState<
        (SearchFormValuesT & { id?: string }) | null
    >(null);

    const [debouncedInputValue, setInputValue, inputValue] =
        useDebouncedState<string>("");

    const [listParams] = useListQueryParams({
        limit: 100,
    });

    const { data } = searchApi.useListSearchesQuery(
        open ? { ...listParams, search: debouncedInputValue } : skipToken,
    );

    const [createSearch, { isLoading: isCreateSearchLoading }] =
        searchApi.useCreateSearchMutation();

    const [updateSearch, { isLoading: isUpdateSearchLoading }] =
        searchApi.useUpdateSearchMutation();

    const [deleteSearch, { isLoading: isDeleteSearchLoading }] =
        searchApi.useDeleteSearchMutation();

    const options = useMemo(() => {
        return data?.payload.items || [];
    }, [data?.payload.items]);

    const handleCreateNewClick = useCallback(() => {
        setEditSearchValue({
            id: "",
            description: "",
            name: initialQueryString || "",
            query: initialQueryString || "",
            permissions: [],
        });
    }, [initialQueryString]);

    const handleEditClick = useCallback(
        (e: React.MouseEvent<HTMLElement>, value: SearchT) => {
            e.preventDefault();
            setEditSearchValue({ ...value });
        },
        [],
    );

    const handleSubmit = useCallback((value: EditSearchDialogValues) => {
        if (!value.id)
            createSearch(formValuesToCreateValues(value))
                .unwrap()
                .then(() => {
                    toast.success(t("searchSelectPopover.createSuccessfully"));
                    setEditSearchValue(null);
                })
                .catch(toastApiError);
        else
            updateSearch(formValuesToCreateValues(value))
                .unwrap()
                .then(() => {
                    toast.success(t("searchSelectPopover.updateSuccessfully"));
                    setEditSearchValue(null);
                })
                .catch(toastApiError);
    }, []);

    const handleDelete = useCallback((value: EditSearchDialogValues) => {
        deleteSearch({ id: value.id })
            .unwrap()
            .then(() => {
                toast.success(t("searchSelectPopover.deleteSuccessfully"));
                setEditSearchValue(null);
            })
            .catch(toastApiError);
    }, []);

    return (
        <>
            <FormAutocompletePopover<SearchT, typeof multiple, false>
                id="search-select-popover"
                options={options}
                anchorEl={anchorEl}
                multiple={multiple}
                value={value}
                onClose={onClose}
                onChange={onChange}
                open={open}
                inputProps={{
                    placeholder: t("searchSelectPopover.placeholder"),
                }}
                inputValue={inputValue}
                onInputChange={(_, value) => setInputValue(value)}
                getOptionLabel={(el) => el.name}
                getOptionDescription={(el) => el.description}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                getOptionKey={(el) => el.id}
                bottomSlot={
                    <Button onClick={handleCreateNewClick} fullWidth>
                        {t("searchSelectPopover.new")}
                    </Button>
                }
                getOptionRightAdornment={(el) => (
                    <IconButton
                        size="small"
                        onClick={(e) => handleEditClick(e, el)}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                )}
            />

            <EditSearchDialog
                open={!!editSearchValue}
                onClose={() => setEditSearchValue(null)}
                defaultValues={editSearchValue || undefined}
                onSubmit={handleSubmit}
                onDelete={handleDelete}
                loading={
                    isCreateSearchLoading ||
                    isUpdateSearchLoading ||
                    isDeleteSearchLoading
                }
            />
        </>
    );
};
