import { Skeleton, Stack, Typography } from "@mui/material";
import IssueRow from "modules/issues/components/list/issue_row/issue_row";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { issueApi } from "shared/model";
import { DashboardTileT } from "shared/model/types";
import { WidgetBase } from "./base";

interface IssueListWidgetProps {
    widget: DashboardTileT;
    onEdit: (widget: DashboardTileT) => void;
    onDelete: (widget: DashboardTileT) => void;
    canManage?: boolean;
}

export const IssueListWidget: FC<IssueListWidgetProps> = (props) => {
    const { t } = useTranslation();

    const { data, isLoading, isFetching, error } = issueApi.useListIssuesQuery({
        q: props.widget.query,
        limit: 50,
        offset: 0,
    });

    const loading = isLoading || isFetching;

    const issues = data?.payload?.items || [];

    if (loading)
        return (
            <WidgetBase {...props}>
                <Stack overflow="auto" px={2} pb={1} gap={1}>
                    {[...Array(10)].map((_, idx) => (
                        <Stack key={idx} direction="row" gap={1}>
                            <Skeleton
                                variant="rounded"
                                width={50}
                                height={21}
                            />

                            <Skeleton
                                variant="rounded"
                                width="100%"
                                height={21}
                            />
                        </Stack>
                    ))}
                </Stack>
            </WidgetBase>
        );

    if (error)
        return (
            <WidgetBase {...props}>
                <Typography
                    variant="body1"
                    color="error"
                    fontWeight={500}
                    px={2}
                    pb={1}
                >
                    {t("dashboards.widgets.issueList.error")}
                </Typography>
            </WidgetBase>
        );

    return (
        <WidgetBase {...props}>
            <Stack overflow="auto" px={2} pb={1}>
                {issues.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                        {t("dashboards.widgets.issueList.empty")}
                    </Typography>
                )}

                {issues.map((issue) => (
                    <IssueRow
                        key={issue.id}
                        issue={issue}
                        showSubscribeButton={false}
                        showUpdateTime={false}
                    />
                ))}
            </Stack>
        </WidgetBase>
    );
};
