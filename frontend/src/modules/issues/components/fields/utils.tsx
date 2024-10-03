import { Avatar } from "@mui/material";
import { EnumOptionT, UserOptionT } from "types";
import { ColorAdornment } from "../../../../components/fields/form_autocomplete/color_adornment";
import { SelectFieldOptionType } from "./select_field";

export const enumToSelectOption = (
    options: EnumOptionT[] | undefined,
): (SelectFieldOptionType & EnumOptionT)[] => {
    if (!options) return [];
    if (!options.length) return [];

    return options.map((el) => ({
        label: el.value,
        id: el.value,
        rightAdornment: el.color ? <ColorAdornment color={el.color} /> : null,
        ...el,
    }));
};

export type UserSelectOptionT = UserOptionT & SelectFieldOptionType;

export const userToSelectOption = (
    options: UserOptionT[] | undefined,
): UserSelectOptionT[] => {
    if (!options) return [];
    if (!options.length) return [];

    return options.map((el) => ({
        label: el.name,
        description: el.email,
        rightAdornment: el.avatar ? (
            <Avatar
                src={el.avatar}
                sx={{
                    width: 26,
                    height: 26,
                    borderRadius: "3px",
                    mr: 1,
                    my: "auto",
                }}
            />
        ) : null,
        ...el,
    }));
};
