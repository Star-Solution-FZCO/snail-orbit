import { AvatarAdornment } from "components/fields/adornments/avatar_adornment";
import { ColorAdornment } from "components/fields/adornments/color_adornment";
import type { FormAutocompleteValueType } from "components/fields/form_autocomplete/form_autocomplete_content";
import dayjs from "dayjs";
import type {
    BasicUserT,
    EnumFieldT,
    IssueProjectT,
    VersionFieldT,
    VersionOptionT,
} from "types";

export type SelectOptionType = FormAutocompleteValueType & { id: string };

export type SelectOptionTypeWithOriginal = SelectOptionType & {
    original: EnumFieldT;
};

export const enumToSelectOption = (
    option: EnumFieldT,
): SelectOptionTypeWithOriginal => ({
    label: option.value,
    id: option.value,
    rightAdornment: option.color ? (
        <ColorAdornment
            color={option.color}
            size="medium"
            sx={{ mr: 1, my: "auto" }}
        />
    ) : null,
    original: option,
});

const enumToSelectOptionsEmptyArr: SelectOptionTypeWithOriginal[] = [];

export const enumToSelectOptions = (
    options: EnumFieldT[] | undefined,
): SelectOptionTypeWithOriginal[] => {
    if (!options) return enumToSelectOptionsEmptyArr;
    if (!options.length) return enumToSelectOptionsEmptyArr;

    return options.map(enumToSelectOption);
};

export type UserSelectOptionT = SelectOptionType & {
    original: BasicUserT;
};

export const userToSelectOption = (user: BasicUserT): UserSelectOptionT => ({
    label: user.name,
    id: user.id,
    description: user.email,
    rightAdornment: user.avatar ? (
        <AvatarAdornment
            src={user.avatar}
            sx={{
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

export type ProjectSelectOptionT = SelectOptionType & {
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

export type VersionSelectOptionT = SelectOptionType & {
    original: VersionFieldT;
};

const formatVersion = (version: string, releaseDate: string | null): string => {
    if (!releaseDate) return version;

    return `${version} (${dayjs(releaseDate).format("DD MMM YYYY")})`;
};

export const versionOptionToSelectOption = (
    option: VersionOptionT,
): SelectOptionType & {
    original: VersionOptionT;
} => ({
    label: formatVersion(option.value, option.release_date),
    id: option.uuid,
    original: option,
});

export const versionFieldToSelectOption = (
    option: VersionFieldT,
): VersionSelectOptionT => ({
    label: formatVersion(option.version, option.release_date),
    id: option.id,
    original: option,
});

export const versionFieldToSelectOptions = (
    options: VersionFieldT[] | undefined,
): VersionSelectOptionT[] => {
    if (!options) return [];
    if (!options.length) return [];

    return options.map(versionFieldToSelectOption);
};
