import { AutocompleteChangeReason } from "@mui/material";
import { skipToken } from "@reduxjs/toolkit/query";
import { SyntheticEvent, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FormAutocompletePopover } from "../../components/fields/form_autocomplete/form_autocomplete";
import { groupApi, userApi } from "../../store";
import type { GroupT } from "../../types";
import { type BasicUserT } from "../../types";
import { useListQueryParams } from "../../utils";
import useDebouncedState from "../../utils/hooks/use-debounced-state";
import { getRightAdornment, isUser } from "./utils";

type ValueType = BasicUserT | GroupT;

type UserGroupSelectPopoverProps = {
    value?: ValueType | ValueType[];
    onChange?: (
        event: SyntheticEvent,
        value: ValueType | ValueType[],
        reason: AutocompleteChangeReason,
    ) => void;
    open: boolean;
    anchorEl?: Element | null;
    multiple?: boolean;
    onClose?: () => unknown;
};

export const UserGroupSelectPopover = (props: UserGroupSelectPopoverProps) => {
    const { t } = useTranslation();
    const { open, anchorEl, multiple, onClose, onChange, value } = props;
    const [debouncedInputValue, setInputValue, inputValue] =
        useDebouncedState<string>("");

    const [listParams] = useListQueryParams({
        limit: 50,
    }); // up to 50 groups means up to 100 elements

    const { data: groupsData } = groupApi.useListGroupQuery(
        open ? { ...listParams, search: debouncedInputValue } : skipToken,
    );
    const { data: usersData } = userApi.useListUserQuery(
        open ? { ...listParams, search: debouncedInputValue } : skipToken,
    );

    const options: ValueType[] = useMemo(
        () => [
            ...(groupsData?.payload.items || []),
            ...(usersData?.payload.items || []),
        ],
        [groupsData, usersData],
    );

    const handleChange = useCallback(
        (
            event: SyntheticEvent,
            value: ValueType[] | ValueType | null,
            reason: AutocompleteChangeReason,
        ) => {
            if (value) onChange?.(event, value, reason);
        },
        [],
    );

    return (
        <FormAutocompletePopover<ValueType, typeof multiple, false>
            id="user-group-select-popover"
            open={open}
            anchorEl={anchorEl}
            multiple={multiple}
            options={options}
            onClose={onClose}
            inputValue={inputValue}
            onInputChange={(_, value) => setInputValue(value)}
            groupBy={(option) =>
                isUser(option)
                    ? t("userGroupSelectPopover.user")
                    : t("userGroupSelectPopover.group")
            }
            inputProps={{
                placeholder: t("userGroupSelectPopover.placeholder"),
            }}
            value={value}
            onChange={handleChange}
            getOptionKey={(option) => option.id}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            filterOptions={(options) => options}
            disableCloseOnSelect
            clearOnBlur={false}
            getOptionRightAdornment={getRightAdornment}
            getOptionLabel={(el) => el.name}
        />
    );
};
