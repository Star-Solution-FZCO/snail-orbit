import type { AutocompleteChangeReason } from "@mui/material";
import { skipToken } from "@reduxjs/toolkit/query";
import type { SyntheticEvent } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { groupApi, userApi } from "shared/model";
import type { GroupT } from "shared/model/types";
import { type BasicUserT } from "shared/model/types";
import { FormAutocompletePopover } from "shared/ui/fields/form_autocomplete/form_autocomplete";
import { useListQueryParams } from "shared/utils";
import useDebouncedState from "shared/utils/hooks/use-debounced-state";
import { getRightAdornment, isUser } from "./utils";

type SelectType = "user" | "group" | "all";

type ValueType<T extends SelectType> = T extends "all"
    ? BasicUserT | GroupT
    : T extends "user"
      ? BasicUserT
      : T extends "group"
        ? GroupT
        : never;

type UserGroupSelectPopoverProps<T extends SelectType> = {
    value?: ValueType<T> | ValueType<T>[];
    onChange?: (
        event: SyntheticEvent,
        value: ValueType<T> | ValueType<T>[] | null,
        reason: AutocompleteChangeReason,
    ) => void;
    open: boolean;
    anchorEl?: Element | null;
    multiple?: boolean;
    onClose?: () => unknown;
    selectType?: T;
};

export const UserGroupSelectPopover = <T extends SelectType>(
    props: UserGroupSelectPopoverProps<T>,
) => {
    const { t } = useTranslation();
    const {
        open,
        anchorEl,
        multiple,
        onClose,
        onChange,
        value,
        selectType = "all",
    } = props;
    const [debouncedInputValue, setInputValue, inputValue] =
        useDebouncedState<string>("");

    const [listParams] = useListQueryParams({
        limit: 50,
    }); // up to 50 groups means up to 100 elements

    const { data: groupsData } = groupApi.useListGroupQuery(
        open && (selectType === "group" || selectType === "all")
            ? { ...listParams, search: debouncedInputValue }
            : skipToken,
    );
    const { data: usersData } = userApi.useListUserQuery(
        open && (selectType === "user" || selectType === "all")
            ? { ...listParams, search: debouncedInputValue }
            : skipToken,
    );

    const options = useMemo(
        () => [
            ...(groupsData?.payload.items || []),
            ...(usersData?.payload.items || []),
        ],
        [groupsData, usersData],
    );

    return (
        <FormAutocompletePopover
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
            // @ts-expect-error TODO: Fix this crap later
            onChange={onChange}
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
