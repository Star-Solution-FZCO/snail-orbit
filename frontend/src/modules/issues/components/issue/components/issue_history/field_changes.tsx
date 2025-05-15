import { Box, Typography } from "@mui/material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { diffWords } from "diff";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import i18n from "shared/i18n";
import type { IssueChangeT, VersionFieldValueT } from "shared/model/types";

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

const renderValue = (change: IssueChangeT, type: "old" | "new"): string => {
    if (change.type !== "field") {
        const target = type === "old" ? change.old_value : change.new_value;
        return target || "";
    }

    const noValue = `${i18n.t("common.no")} ${change.field_name}`;

    switch (change.field_type) {
        case "boolean": {
            const target = type === "old" ? change.old_value : change.new_value;
            return target ? i18n.t("common.yes") : i18n.t("common.no");
        }

        case "integer":
        case "float": {
            const target = type === "old" ? change.old_value : change.new_value;
            return target?.toString() || noValue;
        }

        case "string": {
            const target = type === "old" ? change.old_value : change.new_value;
            return target || "";
        }

        case "date": {
            const target = type === "old" ? change.old_value : change.new_value;
            return dayjs(target).format("DD MMM YYYY");
        }

        case "datetime": {
            const target = type === "old" ? change.old_value : change.new_value;
            return dayjs(target).format("DD MMM YYYY HH:mm");
        }

        case "user": {
            const target = type === "old" ? change.old_value : change.new_value;
            return target?.avatar || noValue;
        }

        case "user_multi": {
            const target = type === "old" ? change.old_value : change.new_value;
            return target?.map((user) => user.name).join(", ") || noValue;
        }

        case "enum":
        case "state": {
            const target = type === "old" ? change.old_value : change.new_value;
            return target?.value || noValue;
        }

        case "enum_multi": {
            const target = type === "old" ? change.old_value : change.new_value;
            return target?.map((option) => option.value).join(", ") || noValue;
        }

        case "version": {
            const target = type === "old" ? change.old_value : change.new_value;
            return target ? renderVersion(target) : noValue;
        }

        case "version_multi": {
            const target = type === "old" ? change.old_value : change.new_value;
            return target?.map(renderVersion).join(", ") || noValue;
        }

        default:
            return "";
    }
};

export const FieldChanges: FC<{
    changes: IssueChangeT[];
}> = ({ changes }) => {
    const { t } = useTranslation();

    return (
        <Box display="flex" flexDirection="column" gap={0.5} mt={0.5}>
            {changes.map((change, index) => (
                <Box
                    key={index}
                    display="flex"
                    flexDirection="column"
                    gap={0.5}
                >
                    {change.type === "subject" || change.type === "text" ? (
                        <>
                            <Typography
                                fontSize="inherit"
                                color="text.secondary"
                            >
                                {t(change.type)}{" "}
                                {t("common.changed").toLowerCase()}:
                            </Typography>

                            {renderDiff(
                                renderValue(change, "old"),
                                renderValue(change, "new"),
                            )}
                        </>
                    ) : (
                        <Box display="flex" gap={1} fontSize={14}>
                            <Typography
                                fontSize="inherit"
                                color="text.secondary"
                            >
                                {change.field_name}:
                            </Typography>
                            <Typography fontSize="inherit">
                                {renderValue(change, "old")} →{" "}
                                {renderValue(change, "new")}
                            </Typography>
                        </Box>
                    )}
                </Box>
            ))}
        </Box>
    );
};
