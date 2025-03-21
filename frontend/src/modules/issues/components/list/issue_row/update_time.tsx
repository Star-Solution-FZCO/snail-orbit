import { Tooltip } from "@mui/material";
import dayjs from "dayjs";
import type { FC } from "react";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { IssueT } from "types";

type UpdateTimeProps = {
    issue: IssueT;
};

export const UpdateTime: FC<UpdateTimeProps> = memo(({ issue }) => {
    const { t } = useTranslation();
    const today = dayjs().startOf("day");

    const [formatedTime, formatedToltip] = useMemo(() => {
        if (!issue.updated_at) return ["-", "-"];

        const dayjsTime = dayjs(issue.updated_at);

        let format = "DD MMM YYYY HH:mm";

        if (dayjsTime.year() === today.year()) {
            if (dayjsTime.isSame(today, "day")) {
                format = "HH:mm";
            } else {
                format = "DD MMM HH:mm";
            }
        }

        return [
            dayjs(dayjsTime).format(format),
            t("issueRow.updateTime.tooltip", {
                time: dayjsTime.format("LLLL"),
                user: issue.updated_by?.name || "-",
            }),
        ];
    }, [issue, t, today]);

    return (
        <Tooltip title={formatedToltip}>
            <span>{formatedTime}</span>
        </Tooltip>
    );
});
