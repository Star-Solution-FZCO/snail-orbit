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

    const [formatedTime, formatedToltip] = useMemo(() => {
        if (!issue.updated_at) return ["-", "-"];

        const dayjsTime = dayjs(issue.updated_at);

        return [
            dayjs(dayjsTime).format("HH:mm"),
            t("issueRow.updateTime.tooltip", {
                time: dayjsTime.format("LLLL"),
                user: issue.updated_by?.name || "-",
            }),
        ];
    }, [issue, t]);

    return (
        <Tooltip title={formatedToltip}>
            <span>{formatedTime}</span>
        </Tooltip>
    );
});
