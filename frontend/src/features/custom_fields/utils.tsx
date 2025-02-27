import { AvatarAdornment } from "components/fields/adornments/avatar_adornment";
import { ColorAdornment } from "components/fields/adornments/color_adornment";
import dayjs from "dayjs";
import type {
    BasicUserT,
    EnumFieldT,
    VersionFieldT,
    VersionOptionT,
} from "types";

export const getEnumColorAdornment = (option: EnumFieldT) =>
    option.color ? (
        <ColorAdornment
            color={option.color}
            size="medium"
            sx={{ mr: 1, my: "auto" }}
        />
    ) : null;

export const getUserAvatarAdornment = (user: BasicUserT) =>
    user.avatar ? (
        <AvatarAdornment
            src={user.avatar}
            sx={{
                mr: 1,
                my: "auto",
            }}
        />
    ) : null;

const formatVersion = (version: string, releaseDate: string | null): string => {
    if (!releaseDate) return version;

    return `${version} (${dayjs(releaseDate).format("DD MMM YYYY")})`;
};

export const versionOptionToField = (
    option: VersionOptionT,
): VersionFieldT => ({
    value: option.value,
    id: option.uuid,
    release_date: option.release_date,
    version: option.value,
    is_archived: option.is_archived,
    is_released: option.is_released,
});

export const cardLabelGetter = <T,>(
    option: T | T[] | null,
    labelGetter: (value: T) => string,
) => {
    if (!option) return undefined;
    if (Array.isArray(option)) {
        return option.map(labelGetter);
    } else {
        return labelGetter(option);
    }
};

export const getVersionFieldLabel = (option: VersionFieldT) =>
    formatVersion(option.version, option.release_date);
