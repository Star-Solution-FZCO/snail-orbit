import { Box, Tooltip, Typography } from "@mui/material";
import dayjs from "dayjs";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { IssueT } from "shared/model/types";
import { IssueLink } from "shared/ui/issue_link";
import { useIssueLinkProps } from "widgets/issue/issue_link/use_issue_link_props";

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

    const issueLinkProps = useIssueLinkProps(issue);

    return (
        <Box display="flex" alignItems="center" fontSize={14} flexWrap="wrap">
            <IssueLink
                mr={1}
                {...issueLinkProps}
                resolved={issue.is_resolved}
                lineThrough={issue.is_resolved}
            >
                {issue.id_readable}
            </IssueLink>

            <Typography color="text.secondary" fontSize="inherit" mr={1}>
                {t("createdBy")}{" "}
                <Typography component="span" color="primary" fontSize="inherit">
                    {issue.created_by.name}
                </Typography>{" "}
                {renderTimestamp(issue.created_at)}
            </Typography>

            {issue.updated_by && issue.updated_at && (
                <Typography color="text.secondary" fontSize="inherit" mr={1}>
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
        </Box>
    );
};
