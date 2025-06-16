import { type AutocompleteChangeReason } from "@mui/material";
import type { FC, SyntheticEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { agileBoardApi } from "shared/model";
import type { AgileBoardCardFieldT } from "shared/model/types";
import { FormAutocompletePopover } from "shared/ui/fields/form_autocomplete/form_autocomplete";

interface ColumnSelectPopoverProps {
    value?: AgileBoardCardFieldT;
    onChange?: (
        event: SyntheticEvent,
        value: AgileBoardCardFieldT | null,
        reason: AutocompleteChangeReason,
    ) => void;
    projectId: string[];
    anchorEl?: Element | null;
    open: boolean;
    onClose?: () => void;
}

export const ColumnSelectPopover: FC<ColumnSelectPopoverProps> = ({
    value,
    onChange,
    projectId,
    open,
    onClose,
    anchorEl,
}) => {
    const { t } = useTranslation();

    const [searchInput, setSearchInput] = useState<string>("");

    const [fetchCustomFields, { data, isLoading }] =
        agileBoardApi.useLazyListAvailableColumnsQuery();

    const options = useMemo(() => {
        if (!data) return [];
        if (!searchInput) return data.payload.items;
        return data.payload.items.filter((el) => el.name.includes(searchInput));
    }, [data, searchInput]);

    useEffect(() => {
        if (open && projectId) fetchCustomFields({ project_id: projectId });
    }, [fetchCustomFields, open, projectId]);

    return (
        <FormAutocompletePopover
            id="column-select-popover"
            options={options}
            multiple={false}
            anchorEl={anchorEl}
            value={value}
            onClose={onClose}
            onChange={onChange}
            open={open}
            inputProps={{
                placeholder: t("searchSelectPopover.placeholder"),
            }}
            inputValue={searchInput}
            onInputChange={(_, value) => setSearchInput(value)}
            getOptionLabel={(el) => el.name}
            isOptionEqualToValue={(a, b) => a.gid === b.gid}
            getOptionKey={(el) => el.gid}
            loading={isLoading}
        />
    );
};
