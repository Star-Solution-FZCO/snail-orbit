import { Avatar } from "@mui/material";
import { ColorAdornment } from "components/fields/form_autocomplete/color_adornment";
import { BasicUserT, EnumFieldT, IssueProjectT } from "types";
import { SelectFieldOptionType } from "./select_field";

export type SelectFieldOptionTypeWithOriginal = SelectFieldOptionType & {
    original: EnumFieldT;
};

export const enumToSelectOption = (
    option: EnumFieldT,
): SelectFieldOptionTypeWithOriginal => ({
    label: option.value,
    id: option.value,
    rightAdornment: option.color ? (
        <ColorAdornment color={option.color} />
    ) : null,
    original: option,
});

export const enumToSelectOptions = (
    options: EnumFieldT[] | undefined,
): SelectFieldOptionTypeWithOriginal[] => {
    if (!options) return [];
    if (!options.length) return [];

    return options.map(enumToSelectOption);
};

export type UserSelectOptionT = SelectFieldOptionType & {
    original: BasicUserT;
};

export const userToSelectOption = (user: BasicUserT): UserSelectOptionT => ({
    label: user.name,
    id: user.id,
    description: user.email,
    rightAdornment: user.avatar ? (
        <Avatar
            src={user.avatar}
            sx={{
                width: 26,
                height: 26,
                borderRadius: "3px",
                mr: 1,
                my: "auto",
            }}
        />
    ) : null,
    original: user,
});

export const userToSelectOptions = (
    options?: BasicUserT[],
): UserSelectOptionT[] => {
    if (!options) return [];
    if (!options.length) return [];

    return options.map(userToSelectOption);
};

export type ProjectSelectOptionT = SelectFieldOptionType & {
    original: IssueProjectT;
};

export const projectToSelectOption = (
    project: IssueProjectT,
): ProjectSelectOptionT => ({
    label: project.name,
    id: project.id,
    original: project,
});

export const projectToSelectOptions = (
    projects?: IssueProjectT[],
): ProjectSelectOptionT[] => {
    if (!projects || !projects.length) return [];

    return projects.map(projectToSelectOption);
};
