type OptionType = { name: string } | { gid: string; name: string };

export const isSameOption = (a: OptionType, b: OptionType) => {
    if ("gid" in a && "gid" in b) return a.gid === b.gid;
    return a.name === b.name;
};

export const getOptionId = (a: OptionType) => {
    if ("gid" in a) return a.gid;
    return a.name;
};
