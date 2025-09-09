import { Button, Skeleton, Stack, Typography } from "@mui/material";
import IssueRow from "modules/issues/components/list/issue_row/issue_row";
import { FC, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { issueApi } from "shared/model";
import { IssueT } from "shared/model/types";
import { WidgetBase } from "./base";
import { WidgetProps } from "./types";

const ITEMS_PER_PAGE = 100;

interface IssueListWidgetProps extends WidgetProps {}

export const IssueListWidget: FC<IssueListWidgetProps> = (props) => {
    const { t } = useTranslation();

    const [offset, setOffset] = useState(0);
    const [issues, setIssues] = useState<IssueT[]>([]);

    const {
        data,
        isLoading: loading,
        error,
        refetch: refetchQuery,
    } = issueApi.useListIssuesQuery(
        {
            q: props.widget.query,
            limit: ITEMS_PER_PAGE,
            offset,
        },
        {
            pollingInterval: props.widget.ui_settings?.polling_interval
                ? (props.widget.ui_settings.polling_interval as number) *
                  60 *
                  1000
                : 10 * 60 * 1000, // default to 10 minutes
        },
    );

    const refetch = useCallback(() => {
        setOffset(0);
        refetchQuery();
    }, [refetchQuery]);

    const count = data?.payload?.count || 0;
    const hasMore = issues.length < count;

    const loadMore = useCallback(() => {
        if (hasMore && !loading) {
            setOffset((prev) => prev + ITEMS_PER_PAGE);
        }
    }, [hasMore, loading]);

    useEffect(() => {
        if (!data?.payload?.items) return;

        if (offset === 0) {
            setIssues(data.payload.items);
            return;
        }

        setIssues((prev) => {
            const existingIds = new Set(prev.map((issue) => issue.id));
            const newIssues = data.payload.items.filter(
                (issue) => !existingIds.has(issue.id),
            );
            return [...prev, ...newIssues];
        });
    }, [data?.payload?.items, offset]);

    if (loading)
        return (
            <WidgetBase {...props} onRefresh={refetch}>
                <Stack overflow="auto" px={2} pb={1} gap={1}>
                    {[...Array(10)].map((_, idx) => (
                        <Stack
                            key={`widget-${props.widget.id}-issue-skeleton-${idx + 1}`}
                            gap={1}
                        >
                            <Stack direction="row" gap={1}>
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

                            <Stack direction="row" gap={1}>
                                <Skeleton
                                    variant="rounded"
                                    width={60}
                                    height={18}
                                />

                                <Skeleton
                                    variant="rounded"
                                    width={60}
                                    height={18}
                                />

                                <Skeleton
                                    variant="rounded"
                                    width={60}
                                    height={18}
                                />
                            </Stack>
                        </Stack>
                    ))}
                </Stack>
            </WidgetBase>
        );

    if (error)
        return (
            <WidgetBase {...props} onRefresh={refetch}>
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
        <WidgetBase {...props} onRefresh={refetch} issueCount={count}>
            <Stack overflow="auto" px={2} pb={1}>
                {issues.length === 0 && !loading && (
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
                        showCustomFields
                        customFieldSlots={5}
                    />
                ))}

                {hasMore && (
                    <Button
                        sx={{ mt: 1 }}
                        onClick={loadMore}
                        variant="outlined"
                        size="small"
                        loading={loading}
                        fullWidth
                    >
                        {t("dashboards.widgets.issueList.loadMore")}
                    </Button>
                )}
            </Stack>
        </WidgetBase>
    );
};
