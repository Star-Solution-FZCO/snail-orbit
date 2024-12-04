import {
    Autocomplete,
    CircularProgress,
    debounce,
    TextField,
} from "@mui/material";
import { t } from "i18next";
import React, { FC, useCallback, useState } from "react";
import { ListSelectQueryParams } from "types";
import { useListQueryParams } from "utils";

interface IAsyncAutocompleteProps {
    onChange: (value: any) => void;
    queryFn: (...args: any[]) => any;
}

export const AsyncAutocomplete: FC<IAsyncAutocompleteProps> = ({
    onChange,
    queryFn,
}) => {
    const [value, setValue] = useState<{ id: string; name: string } | null>(
        null,
    );

    const [queryParams, updateQueryParams, resetQueryParams] =
        useListQueryParams<ListSelectQueryParams>({ limit: 20, offset: 0 });
    const [autocompleteOpen, setAutocompleteOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const { data, isLoading, isFetching } = queryFn(searchQuery, {
        skip: !autocompleteOpen,
    });

    const handleOpenAutocomplete = () => {
        setAutocompleteOpen(true);
    };

    const handleChange = (_: React.SyntheticEvent, newValue: any) => {
        setValue(newValue);
        onChange(newValue);
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
            !isLoading
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

    const options = data?.payload?.items || [];
    const loading = isLoading || isFetching;

    return (
        <Autocomplete
            value={value}
            inputValue={searchQuery}
            options={options}
            onOpen={handleOpenAutocomplete}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={t("projects.access.userOrGroup")}
                    placeholder={t("projects.access.selectUserOrGroup")}
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
            getOptionLabel={(option) => option.name}
            onChange={handleChange}
            onInputChange={handleSearchInputChange}
            ListboxProps={{
                onScroll: handleScroll,
            }}
        />
    );
};
