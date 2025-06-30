import { Box, Button, CircularProgress } from "@mui/material";
import type { FC } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { issueApi } from "shared/model";
import type { CommentT, IssueHistoryT } from "shared/model/types";
import { toastApiError, useListQueryParams } from "shared/utils";
import { useLSState } from "shared/utils/helpers/local-storage";
import { CommentCard } from "../comment_card/comment_card";
import { CreateCommentForm } from "../comments/create_comment_form";
import { IssueHistory } from "../issue_history/issue_history";
import { DeleteCommentDialog } from "./delete_comment_dialog";
import { issuesActivitiesSettingsDefaultValues } from "./issue_activities.types";
import { IssueActivitiesSettings } from "./issue_activities_settings";

type IssueActivitiesProps = {
    issueId: string;
};

const IssueActivities: FC<IssueActivitiesProps> = ({ issueId }) => {
    const { t } = useTranslation();
    const [listQueryParams, updateListQueryParams] = useListQueryParams({
        sort_by: "time",
    });

    const [viewParams, setViewParams] = useLSState(
        "ISSUES_ACTIVITIES_PARAMS",
        issuesActivitiesSettingsDefaultValues,
    );

    const { data: issueData, isLoading: issueLoading } =
        issueApi.useGetIssueQuery(issueId);

    const {
        data,
        isLoading: feedLoading,
        refetch: refetchFeed,
    } = issueApi.useListIssueFeedQuery({
        id: issueId,
        params: listQueryParams,
    });

    const { data: issueSpentTime, isLoading: spentTimeLoading } =
        issueApi.useGetIssueSpentTimeQuery(issueId);

    const [deleteComment, { isLoading: isDeleteDialogLoading }] =
        issueApi.useDeleteIssueCommentMutation();

    const [currentEditingComment, setCurrentEditingComment] =
        useState<CommentT | null>(null);
    const [deleteCommentDialogOpen, setDeleteCommentDialogOpen] =
        useState(false);

    const handleClickDeleteComment = (comment: CommentT) => {
        setCurrentEditingComment(comment);
        setDeleteCommentDialogOpen(true);
    };

    const handleCloseDeleteCommentDialog = () => {
        setDeleteCommentDialogOpen(false);
        setCurrentEditingComment(null);
    };

    const handleClickDelete = () => {
        if (!currentEditingComment) return;

        deleteComment({ id: issueId, commentId: currentEditingComment.id })
            .unwrap()
            .then(handleCloseDeleteCommentDialog)
            .then(refetchFeed)
            .catch(toastApiError);
    };

    useEffect(() => {
        updateListQueryParams({
            sort_by: viewParams.sortOrder === "oldestFirst" ? "time" : "-time",
            offset: 0,
        });
    }, [updateListQueryParams, viewParams.sortOrder]);

    const handleClickLoadMore = useCallback(() => {
        updateListQueryParams({
            limit: listQueryParams.limit + 10,
        });
    }, [listQueryParams, updateListQueryParams]);

    const activities = useMemo(
        () =>
            (data?.payload.items || []).filter(
                (activity) =>
                    (activity.type === "comment" &&
                        viewParams.displayComments) ||
                    (activity.type === "history" &&
                        viewParams.displayingActivities),
            ),
        [data, viewParams],
    );
    const rowCount = data?.payload.count || 0;
    const totalSpentTime = issueSpentTime?.payload?.total_spent_time || 0;

    return (
        <Box display="flex" flexDirection="column">
            <IssueActivitiesSettings
                value={viewParams}
                onChange={setViewParams}
                totalSpentTime={totalSpentTime}
            />

            <Box pl={1} my={2}>
                <CreateCommentForm
                    issueId={issueId}
                    projectId={issueData?.payload.project.id}
                />
            </Box>

            {(feedLoading || spentTimeLoading || issueLoading) && (
                <Box display="flex" justifyContent="center">
                    <CircularProgress color="inherit" size={20} />
                </Box>
            )}

            <Box display="flex" flexDirection="column" gap={1}>
                {activities.map((activity) => {
                    if (activity.type === "comment") {
                        const comment = activity.data as CommentT;
                        return (
                            <CommentCard
                                key={comment.id}
                                issueId={issueId}
                                projectId={issueData?.payload.project.id}
                                comment={comment}
                                onEdit={setCurrentEditingComment}
                                onCancel={() => setCurrentEditingComment(null)}
                                onDelete={handleClickDeleteComment}
                                isEditing={
                                    currentEditingComment?.id === comment.id &&
                                    !deleteCommentDialogOpen
                                }
                            />
                        );
                    }

                    if (activity.type === "history") {
                        const record = activity.data as IssueHistoryT;
                        return <IssueHistory key={record.id} record={record} />;
                    }

                    return null;
                })}
            </Box>

            {rowCount > listQueryParams.offset + listQueryParams.limit &&
                (viewParams.displayComments ||
                    viewParams.displayingActivities) && (
                    <Button
                        sx={{ mt: 1 }}
                        onClick={handleClickLoadMore}
                        variant="outlined"
                        color="secondary"
                        size="small"
                    >
                        {t("issues.activities.loadMore")}
                    </Button>
                )}

            <DeleteCommentDialog
                open={deleteCommentDialogOpen}
                onClose={handleCloseDeleteCommentDialog}
                onSubmit={handleClickDelete}
                isLoading={isDeleteDialogLoading}
            />
        </Box>
    );
};

export { IssueActivities };
