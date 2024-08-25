import { EnumOptionT } from "../../../../types";

export const enumToSelectOption = (options: EnumOptionT[] | undefined) => {
    if (!options) return [];
    return options.map(({ value, color }) => ({
        label: value,
        id: value,
        color,
    }));
};
