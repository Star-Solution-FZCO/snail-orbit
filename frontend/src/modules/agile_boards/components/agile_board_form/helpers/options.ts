import type { OptionT } from "../types/options.types";

export const getOptionValue = (option: OptionT): string => {
    if (typeof option === "object") {
        return "value" in option ? option.value || "" : option.name;
    }
    return option.toString();
};

export const getOptionKey = (option: OptionT): string => {
    if (typeof option === "object") {
        return "id" in option ? option.id : option.value || "";
    }
    return option.toString();
};
