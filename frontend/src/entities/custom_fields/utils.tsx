import dayjs from "shared/date";
import i18n from "shared/i18n";
import type {
    BasicUserT,
    CustomFieldOptionT,
    VersionFieldValueT,
} from "shared/model/types";
import { AvatarAdornment } from "shared/ui/fields/adornments/avatar_adornment";
import { ColorAdornment } from "shared/ui/fields/adornments/color_adornment";

export const getOptionColorAdornment = (
    option: { color?: string | null } | object,
) =>
    "color" in option && option.color ? (
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

export const getCustomFieldOptionLabel = (option: CustomFieldOptionT) => {
    if (option.value === null) return i18n.t("No value");
    if ("release_date" in option)
        return formatVersion(option.value, option.release_date || null);
    if (typeof option.value === "string") return option.value;
    return option.value.name;
};

export const getVersionFieldLabel = (option: VersionFieldValueT) =>
    formatVersion(option.value, option.release_date || null);
