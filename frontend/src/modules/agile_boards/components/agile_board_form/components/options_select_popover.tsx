import { type AutocompleteChangeReason } from "@mui/material";
import type { FC, SyntheticEvent } from "react";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { customFieldsApi } from "shared/model";
import type {
    ShortOptionOutput,
    UserOutput,
} from "shared/model/types/backend-schema.gen";
import { FormAutocompletePopover } from "shared/ui/fields/form_autocomplete/form_autocomplete";
import { useListQueryParams } from "shared/utils";

type OptionT = UserOutput | ShortOptionOutput;

const getOptionValue = (option: OptionT): string => {
    return "value" in option ? option.value : option.name;
};

interface OptionsSelectPopoverProps {
    value?: OptionT[];
    onChange?: (
        event: SyntheticEvent,
        value: OptionT | null,
        reason: AutocompleteChangeReason,
    ) => void;
    anchorEl?: Element | null;
    open: boolean;
    onClose?: () => void;
    fieldId: string;
}

export const OptionsSelectPopover: FC<OptionsSelectPopoverProps> = ({
    value,
    onChange,
    open,
    onClose,
    anchorEl,
    fieldId,
}) => {
    const { t } = useTranslation();

    const [listQueryParams] = useListQueryParams({
        limit: 0,
    });

    const [fetchOptions, { data: options, isLoading: isOptionsLoading }] =
        customFieldsApi.useLazyListGroupSelectOptionsQuery();

    const filteredOptions = useMemo(() => {
        const selectedValues = new Set(value?.map(getOptionValue) || []);
        return (
            options?.payload.items.filter(
                (el) => !selectedValues.has(getOptionValue(el)),
            ) || []
        );
    }, [options?.payload.items, value]);

    useEffect(() => {
        if (open) fetchOptions({ gid: fieldId, ...listQueryParams });
    }, [fetchOptions, fieldId, listQueryParams, open]);

    return (
        <FormAutocompletePopover<OptionT, false, false>
            id="options-select-popover"
            options={filteredOptions}
            anchorEl={anchorEl}
            onClose={onClose}
            onChange={onChange}
            open={open}
            inputProps={{
                placeholder: t("searchSelectPopover.placeholder"),
            }}
            getOptionLabel={getOptionValue}
            isOptionEqualToValue={(a, b) =>
                getOptionValue(a) === getOptionValue(b)
            }
            getOptionKey={(el) => ("id" in el ? el.id : el.value)}
            loading={isOptionsLoading}
        />
    );
};
