import GroupIcon from "@mui/icons-material/Group";
import { skipToken } from "@reduxjs/toolkit/query";
import type { ReactNode, SyntheticEvent } from "react";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AvatarAdornment } from "../components/fields/adornments/avatar_adornment";
import type { FormAutocompletePopoverProps } from "../components/fields/form_autocomplete/form_autocomplete";
import { FormAutocompletePopover } from "../components/fields/form_autocomplete/form_autocomplete";
import type { FormAutocompleteValueType } from "../components/fields/form_autocomplete/form_autocomplete_content";
import { groupApi, userApi } from "../store";
import type { GroupT } from "../types";
import { type BasicUserT } from "../types";
import { useListQueryParams } from "../utils";

type UserGroupSelectPopoverProps<
    F extends boolean | undefined,
    G extends boolean | undefined,
> = Pick<
    FormAutocompletePopoverProps<F, G>,
    "anchorEl" | "open" | "multiple" | "onClose"
> & {
    onChange: (
        values: OptionType[],
        reason: "selectOption" | "removeOption",
    ) => unknown;
    value?: (BasicUserT | GroupT)[];
};

type UserOptionType = {
    type: "user";
    value: BasicUserT;
    label: string;
    rightAdornment?: ReactNode;
    id: string;
};
type GroupOptionType = {
    type: "group";
    value: GroupT;
    label: string;
    rightAdornment?: ReactNode;
    id: string;
};

export type OptionType = UserOptionType | GroupOptionType;

const makeUserOption = (user: BasicUserT): UserOptionType => ({
    type: "user",
    value: user,
    id: user.id,
    label: user.name,
    rightAdornment: <AvatarAdornment src={user.avatar} />,
});

const makeGroupOption = (group: GroupT): GroupOptionType => ({
    type: "group",
    value: group,
    label: group.name,
    id: group.id,
    rightAdornment: (
        <GroupIcon fontSize="medium" sx={{ width: 26, height: 26 }} />
    ),
});

export const UserGroupSelectPopover = <
    F extends boolean | undefined,
    G extends boolean | undefined,
>(
    props: UserGroupSelectPopoverProps<F, G>,
) => {
    const { t } = useTranslation();
    const { open, anchorEl, multiple, onClose, onChange, value } = props;

    const [listParams] = useListQueryParams({ limit: 15 }); // up to 15 groups means up to 30 elements

    const { data: groupsData } = groupApi.useListGroupQuery(
        open ? listParams : skipToken,
    );
    const { data: usersData } = userApi.useListUserQuery(
        open ? listParams : skipToken,
    );

    const options: OptionType[] = useMemo(
        () => [
            ...(groupsData?.payload.items.map(makeGroupOption) || []),
            ...(usersData?.payload.items.map(makeUserOption) || []),
        ],
        [groupsData, usersData],
    );

    const valueOptions: OptionType[] | undefined = useMemo(
        () =>
            value
                ? value.map((el) =>
                      "email" in el ? makeUserOption(el) : makeGroupOption(el),
                  )
                : undefined,
        [value],
    );

    const handleChange = useCallback(
        (
            _: SyntheticEvent,
            value:
                | FormAutocompleteValueType[]
                | FormAutocompleteValueType
                | null,
            reason: string,
        ) => {
            if (reason === "selectOption" || reason === "removeOption")
                onChange(value as OptionType[], reason);
        },
        [],
    );

    return (
        <FormAutocompletePopover
            id="user-group-select-popover"
            open={open}
            anchorEl={anchorEl}
            multiple={multiple}
            options={options}
            onClose={onClose}
            groupBy={(option) =>
                (option as OptionType).type === "group"
                    ? t("userGroupSelectPopover.group")
                    : t("userGroupSelectPopover.user")
            }
            inputProps={{
                placeholder: t("userGroupSelectPopover.placeholder"),
            }}
            // @ts-ignore
            value={valueOptions}
            onChange={handleChange}
            getOptionKey={(option) => (option as OptionType).id}
            isOptionEqualToValue={(option, value) => option.id === value.id}
        />
    );
};
