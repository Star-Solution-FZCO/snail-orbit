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

    const [formatedTime, formatedTooltip] = useMemo(() => {
        if (!issue.updated_at && !issue.created_at) return ["-", "-"];
        const time = issue.updated_at || issue.created_at;
        const userForTooltip =
            issue.updated_by?.name || issue.created_by?.name || "-";

        const dayjsTime = dayjs(time);

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
            issue.updated_at
                ? t("issueRow.updateTime.updateTooltip", {
                      time: dayjsTime.format("LLLL"),
                      user: userForTooltip,
                  })
                : t("issueRow.updateTime.createTooltip", {
                      time: dayjsTime.format("LLLL"),
                      user: userForTooltip,
                  }),
        ];
    }, [issue, t, today]);

    return (
        <Tooltip title={formatedTooltip}>
            <span>{formatedTime}</span>
        </Tooltip>
    );
});
