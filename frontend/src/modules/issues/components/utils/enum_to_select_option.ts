import { EnumOptionT, UserOptionT } from "types";

export function isUserOption(option: object): option is UserOptionT {
    return "id" in option;
}

export const enumToSelectOption = (
    options: EnumOptionT[] | UserOptionT[] | undefined,
) => {
    if (!options) return [];
    if (!options.length) return [];

    return options.map((el) => {
        if (isUserOption(el))
            return {
                label: el.name,
                id: el.id,
                description: el.email,
            };
        else
            return {
                label: el.value,
                id: el.value,
                color: el.color,
            };
    });
};
