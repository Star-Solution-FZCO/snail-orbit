import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Stack, Tooltip, Typography } from "@mui/material";
import dayjs from "dayjs";
import { IssueLink } from "entities/issue/issue_link/issue_link";
import { useCallback, type FC } from "react";
import { useTranslation } from "react-i18next";
import type { IssueT } from "shared/model/types";

type IssueMetaProps = {
    issue: IssueT;
};

const renderTimestamp = (date: string) => (
    <Tooltip
        title={dayjs.utc(date).local().format("DD MMM YYYY HH:mm")}
        placement="bottom"
    >
        <Typography component="span" fontSize="inherit">
            {dayjs.utc(date).local().fromNow()}
        </Typography>
    </Tooltip>
);

export const IssueMeta: FC<IssueMetaProps> = ({ issue }) => {
    const { t } = useTranslation();

    const renderVisibility = useCallback(() => {
        if (!issue.has_custom_permissions) return null;

        const firstTarget = issue.permissions[0].target.name;
        const targets = issue.permissions.map((p) => p.target.name).join(", ");
        const remainingCount = issue.permissions.length - 1;

        return (
            <Typography
                title={targets}
                display="flex"
                alignItems="center"
                gap={0.5}
                flexShrink={0}
                ml="auto"
                fontSize="inherit"
                color="primary"
            >
                <LockOutlinedIcon fontSize="inherit" color="primary" />

                {issue.permissions.length === 1
                    ? firstTarget
                    : `${firstTarget} +${remainingCount}`}
            </Typography>
        );
    }, [t, issue.has_custom_permissions, issue.permissions]);

    return (
        <Stack direction="row" fontSize={14}>
            <Stack
                direction="row"
                alignItems="center"
                fontSize={14}
                flexWrap="wrap"
            >
                <IssueLink
                    mr={1}
                    issue={issue}
                    resolved={issue.is_resolved}
                    lineThrough={issue.is_resolved}
                    flexShrink={0}
                >
                    {issue.id_readable}
                </IssueLink>

                <Typography color="text.secondary" fontSize="inherit" mr={1}>
                    {t("createdBy")}{" "}
                    <Typography
                        component="span"
                        color="primary"
                        fontSize="inherit"
                    >
                        {issue.created_by.name}
                    </Typography>{" "}
                    {renderTimestamp(issue.created_at)}
                </Typography>

                {issue.updated_by && issue.updated_at && (
                    <Typography
                        color="text.secondary"
                        fontSize="inherit"
                        mr={1}
                    >
                        {t("updatedBy")}{" "}
                        <Typography
                            component="span"
                            color="primary"
                            fontSize="inherit"
                        >
                            {issue.updated_by.name}
                        </Typography>{" "}
                        {renderTimestamp(issue.updated_at)}
                    </Typography>
                )}

                {issue.resolved_at && (
                    <Typography color="text.secondary" fontSize="inherit">
                        {t("resolved")} {renderTimestamp(issue.resolved_at)}
                    </Typography>
                )}
            </Stack>

            {renderVisibility()}
        </Stack>
    );
};
