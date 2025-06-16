import { type AutocompleteChangeReason } from "@mui/material";
import type { FC, SyntheticEvent } from "react";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { agileBoardApi } from "shared/model";
import type { CustomFieldGroupLinkT } from "shared/model/types";
import { FormAutocompletePopover } from "shared/ui/fields/form_autocomplete/form_autocomplete";
import { useListQueryParams } from "shared/utils";

interface CardCustomFieldsSelectPopoverProps {
    value?: CustomFieldGroupLinkT[];
    onChange?: (
        event: SyntheticEvent,
        value: CustomFieldGroupLinkT | null,
        reason: AutocompleteChangeReason,
    ) => void;
    anchorEl?: Element | null;
    open: boolean;
    onClose?: () => void;
    projectIds: string[];
}

export const CardCustomFieldsSelectPopover: FC<
    CardCustomFieldsSelectPopoverProps
> = ({ value, onChange, open, onClose, anchorEl, projectIds }) => {
    const { t } = useTranslation();

    const [listQueryParams] = useListQueryParams({
        limit: 0,
    });

    const [fetchOptions, { data: options, isLoading: isOptionsLoading }] =
        agileBoardApi.useLazyListAvailableCustomFieldsQuery();

    const filteredOptions = useMemo(() => {
        const selectedValuesSet = new Set(value?.map((el) => el.gid) || []);
        return (
            options?.payload?.items.filter(
                (option) => !selectedValuesSet.has(option.gid),
            ) || []
        );
    }, [options, value]);

    useEffect(() => {
        if (open)
            fetchOptions({
                project_id: projectIds,
            });
    }, [fetchOptions, listQueryParams, open, projectIds]);

    return (
        <FormAutocompletePopover<CustomFieldGroupLinkT, false, false>
            id="card-custom-fields-select-popover"
            options={filteredOptions}
            anchorEl={anchorEl}
            onClose={onClose}
            onChange={onChange}
            open={open}
            inputProps={{
                placeholder: t("searchSelectPopover.placeholder"),
            }}
            getOptionLabel={(el) => el.name}
            isOptionEqualToValue={(a, b) => a.gid === b.gid}
            getOptionKey={(el) => el.gid}
            loading={isOptionsLoading}
        />
    );
};
