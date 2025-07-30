import { type AutocompleteChangeReason } from "@mui/material";
import type { FC, SyntheticEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { agileBoardApi } from "shared/model";
import type { AgileBoardCardFieldT } from "shared/model/types";
import { FormAutocompletePopover } from "shared/ui/fields/form_autocomplete/form_autocomplete";

interface SwimlanesSelectPopoverProps {
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

export const SwimlanesSelectPopover: FC<SwimlanesSelectPopoverProps> = ({
    value,
    onChange,
    projectId,
    open,
    onClose,
    anchorEl,
}) => {
    const { t } = useTranslation();

    const [searchInput, setSearchInput] = useState<string>("");

    const [fetchSwimlaneFields, { data, isLoading }] =
        agileBoardApi.useLazyListAvailableSwimlanesQuery();

    const options = useMemo(() => {
        if (!data) return [];
        let res = searchInput
            ? data.payload.items.filter((el) => el.name.includes(searchInput))
            : data.payload.items;
        res = [...res, { gid: "none", name: t("none"), type: "string" }];

        return res;
    }, [data, searchInput]);

    useEffect(() => {
        if (open && projectId) fetchSwimlaneFields({ project_id: projectId });
    }, [fetchSwimlaneFields, open, projectId]);

    return (
        <FormAutocompletePopover
            id="swimlanes-select-popover"
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
