import { Box, Typography } from "@mui/material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { diffWords } from "diff";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import i18n from "shared/i18n";
import type {
    BasicUserT,
    CustomFieldT,
    CustomFieldValueT,
    FieldBaseT,
    VersionFieldValueT,
} from "shared/model/types";
import type { IssueFieldChangeOutput } from "shared/model/types/backend-schema.gen";

dayjs.extend(relativeTime);
dayjs.extend(utc);

const renderDiff = (oldText: string, newText: string) => {
    const diff = diffWords(oldText, newText);

    return (
        <Box
            sx={[
                {
                    fontSize: "inherit",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",

                    "& ins": {
                        textDecoration: "none",
                        backgroundColor: "rgba(62,110,70,0.7)",
                    },
                    "& del": {
                        textDecoration: "none",
                        backgroundColor: "rgba(172,70,56,0.7)",
                    },
                },
                (theme) =>
                    theme.applyStyles("light", {
                        "& ins": {
                            backgroundColor: "rgba(109,220,101,0.7)",
                        },
                        "& del": {
                            backgroundColor: "rgba(228,83,70,0.7)",
                        },
                    }),
            ]}
        >
            {diff.map((part, index) => {
                if (part.added) {
                    return <ins key={index}>{part.value}</ins>;
                } else if (part.removed) {
                    return <del key={index}>{part.value}</del>;
                } else {
                    return <span key={index}>{part.value}</span>;
                }
            })}
        </Box>
    );
};

const renderVersion = (version: VersionFieldValueT) => {
    return version.release_date
        ? `${version.value} (${dayjs(version.release_date).format(
              "DD MMM YYYY",
          )})`
        : version.value;
};

const renderValue = (
    value: CustomFieldValueT,
    field: CustomFieldT | "subject" | "text",
): string => {
    if (value === null || value === undefined) {
        if (typeof field === "string") {
            return "";
        }
        return `${i18n.t("common.no")} ${field.name}`;
    }

    if (typeof field === "string") {
        switch (field) {
            case "subject":
            case "text":
                return value as string;
            default:
                return String(value);
        }
    }

    switch (field.type) {
        case "boolean":
            return value ? i18n.t("common.yes") : i18n.t("common.no");

        case "integer":
        case "float":
            return value.toString();

        case "string":
            return value as string;

        case "date":
            return dayjs(value as string).format("DD MMM YYYY");

        case "datetime":
            return dayjs(value as string).format("DD MMM YYYY HH:mm");

        case "user":
            return (value as BasicUserT).name;

        case "user_multi":
            return (value as BasicUserT[]).map((user) => user.name).join(", ");

        case "enum":
        case "state":
            return (value as FieldBaseT).value;

        case "enum_multi":
            return (value as EnumFieldT[])
                .map((option) => option.value)
                .join(", ");

        case "version":
            return renderVersion(value as VersionFieldValueT);

        case "version_multi":
            return (value as VersionFieldValueT[])
                .map(renderVersion)
                .join(", ");

        default:
            return String(value);
    }
};

export const FieldChanges: FC<{ changes: IssueFieldChangeOutput[] }> = ({
    changes,
}) => {
    const { t } = useTranslation();

    return (
        <Box display="flex" flexDirection="column" gap={0.5} mt={0.5}>
            {changes.map(({ field, old_value, new_value }, index) => (
                <Box
                    key={index}
                    display="flex"
                    flexDirection="column"
                    gap={0.5}
                >
                    {typeof field === "string" &&
                    (field === "subject" || field === "text") ? (
                        <>
                            <Typography
                                fontSize="inherit"
                                color="text.secondary"
                            >
                                {t(field)} {t("common.changed").toLowerCase()}:
                            </Typography>

                            {renderDiff(
                                renderValue(old_value, field),
                                renderValue(new_value, field),
                            )}
                        </>
                    ) : (
                        <Box display="flex" gap={1} fontSize={14}>
                            <Typography
                                fontSize="inherit"
                                color="text.secondary"
                            >
                                {typeof field === "string"
                                    ? t(field)
                                    : field.name}
                                :
                            </Typography>
                            <Typography fontSize="inherit">
                                {renderValue(old_value, field)} →{" "}
                                {renderValue(new_value, field)}
                            </Typography>
                        </Box>
                    )}
                </Box>
            ))}
        </Box>
    );
};
