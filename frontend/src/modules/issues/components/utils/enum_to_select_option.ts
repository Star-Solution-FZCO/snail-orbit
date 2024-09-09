import { EnumOptionT, isUserOption, UserOptionT } from "types";

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
