import { Box, Tooltip, Typography } from "@mui/material";
import { t } from "i18next";
import type { FC } from "react";
import dayjs from "shared/date";
import type { IssueHistoryT } from "shared/model/types";
import { UserAvatar } from "shared/ui";
import { FieldChanges } from "./field_changes";

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
            <UserAvatar
                src={record.author.avatar}
                size={32}
                isBot={record.author.is_bot}
            />

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
