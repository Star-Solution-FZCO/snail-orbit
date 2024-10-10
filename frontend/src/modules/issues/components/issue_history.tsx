import { Box, Tooltip, Typography } from "@mui/material";
import { UserAvatar } from "components";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import i18n from "i18n";
import { t } from "i18next";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import {
    BasicCustomFieldT,
    BasicUserT,
    CustomFieldValueT,
    FieldValueChangeT,
    IssueHistoryT,
    StateFieldT,
} from "types";

dayjs.extend(relativeTime);
dayjs.extend(utc);

const renderValue = (
    value: CustomFieldValueT,
    field: BasicCustomFieldT | "subject" | "text",
): string => {
    if (value === null || value === undefined) {
        return `${i18n.t("common.no")} ${typeof field === "string" ? field : field.name}`;
    }

    if (typeof field === "string") {
        switch (field) {
            case "subject":
                return value as string;
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
            return dayjs(value).format("DD MMM YYYY");

        case "datetime":
            return dayjs(value).format("DD MMM YYYY HH:mm");

        case "user":
            return (value as BasicUserT).name;

        case "user_multi":
            return (value as BasicUserT[]).map((user) => user.name).join(", ");

        case "enum":
            return value;

        case "enum_multi":
            return (value as string[]).join(", ");

        case "state":
            return (value as StateFieldT).state;

        default:
            return String(value);
    }
};

const FieldChanges: FC<{ changes: FieldValueChangeT[] }> = ({ changes }) => {
    const { t } = useTranslation();

    return (
        <Box display="flex" flexDirection="column" gap={0.5}>
            {changes.map(({ field, old_value, new_value }, index) => (
                <Box key={index} display="flex" gap={1} fontSize={14}>
                    <Typography fontSize="inherit" color="text.secondary">
                        {typeof field === "string" ? t(field) : field.name}:
                    </Typography>

                    <Typography fontSize="inherit">
                        {renderValue(old_value, field)} →{" "}
                        {renderValue(new_value, field)}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
};

const IssueHistory: FC<{ record: IssueHistoryT }> = ({ record }) => {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
                px: 1,
                py: 0.5,
                borderRadius: 0.5,
                "&:hover": {
                    backgroundColor: "action.hover",
                },
            }}
        >
            <UserAvatar src={record.author.avatar} size={32} />

            <Box display="flex" flexDirection="column" fontSize={14}>
                <Box height="24px" display="flex" alignItems="center" gap={1}>
                    <Typography fontSize="inherit">
                        {record.author.name}
                    </Typography>

                    <Tooltip
                        title={dayjs
                            .utc(record.time)
                            .local()
                            .format("DD MMM YYYY HH:mm")}
                        placement="top"
                    >
                        <Typography fontSize="inherit" color="text.secondary">
                            {t("issues.history.updated")}{" "}
                            {dayjs.utc(record.time).local().fromNow()}
                        </Typography>
                    </Tooltip>
                </Box>

                <FieldChanges changes={record.changes} />
            </Box>
        </Box>
    );
};

export { IssueHistory };
