import HistoryIcon from "@mui/icons-material/History";
import {
    Avatar,
    Box,
    CircularProgress,
    Tooltip,
    Typography,
} from "@mui/material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import i18n from "i18n";
import { t } from "i18next";
import { FC } from "react";
import { issueApi } from "store";
import {
    BasicCustomFieldT,
    BasicUserT,
    CustomFieldValueT,
    FieldValueChangeT,
    IssueHistoryT,
    StateFieldT,
} from "types";
import { formatErrorMessages } from "utils";

dayjs.extend(relativeTime);
dayjs.extend(utc);

const renderValue = (
    value: CustomFieldValueT,
    field: BasicCustomFieldT,
): string => {
    if (value === null || value === undefined) {
        return `${i18n.t("common.no")} ${field.name}`;
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
    return (
        <Box display="flex" flexDirection="column" gap={0.5}>
            {changes.map(({ field, old_value, new_value }, index) => (
                <Box key={index} display="flex" gap={1} fontSize={14}>
                    <Typography fontSize="inherit" color="text.secondary">
                        {field.name}:
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

const IssueHistoryCard: FC<{ record: IssueHistoryT }> = ({ record }) => {
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
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                border={1}
                borderColor="divider"
                borderRadius={1}
                width="36px"
                height="36px"
                p={0.5}
            >
                <HistoryIcon color="disabled" />
            </Box>

            <Box display="flex" flexDirection="column" gap={0.5}>
                <Box
                    display="flex"
                    alignItems="center"
                    gap={1}
                    fontSize={14}
                    height="36px"
                >
                    <Avatar
                        sx={{ width: 24, height: 24 }}
                        src={record.author.avatar}
                    />

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

interface IIssueHistoryProps {
    issueId: string;
}

const IssueHistory: FC<IIssueHistoryProps> = ({ issueId }) => {
    const { data, isLoading, error } = issueApi.useListIssueHistoryQuery({
        id: issueId,
        params: { limit: 0, offset: 0 },
    });

    const records = data?.payload.items || [];

    if (error) {
        return (
            <Typography fontSize={24} fontWeight="bold">
                {formatErrorMessages(error) || t("issues.history.fetch.error")}
            </Typography>
        );
    }

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center">
                <CircularProgress color="inherit" size={20} />
            </Box>
        );
    }

    if (!records.length) {
        return <Typography>{t("issues.history.empty")}</Typography>;
    }

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            {records.map((record) => (
                <IssueHistoryCard key={record.id} record={record} />
            ))}
        </Box>
    );
};

export { IssueHistory };
