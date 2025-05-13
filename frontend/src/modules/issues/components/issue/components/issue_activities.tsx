import CommentIcon from "@mui/icons-material/Comment";
import HistoryIcon from "@mui/icons-material/History";
import type { SelectChangeEvent } from "@mui/material";
import {
    Box,
    Button,
    CircularProgress,
    MenuItem,
    Select,
    styled,
    Tooltip,
    Typography,
} from "@mui/material";
import { t } from "i18next";
import type { FC } from "react";
import { useCallback, useMemo, useState } from "react";
import { issueApi } from "shared/model";
import type {
    CommentT,
    IssueActivityTypeT,
    IssueHistoryT,
} from "shared/model/types";
import { formatSpentTime, useListQueryParams } from "shared/utils";
import { CommentCard } from "./comment_card/comment_card";
import { CreateCommentForm } from "./comments/create_comment_form";
import { DeleteCommentDialog } from "./delete_comment_dialog";
import { IssueHistory } from "./issue_history/issue_history";

const ActivityTypeButton = styled(Button, {
    shouldForwardProp: (name) => name !== "enabled",
})<{ enabled?: boolean }>(({ theme, enabled }) => ({
    borderRadius: 0,
    borderLeft: 0,
    borderRight: 0,
    borderBottom: 0,
    borderColor: enabled ? theme.palette.primary.main : theme.palette.divider,
    "& svg": {
        fill: enabled
            ? theme.palette.primary.main
            : theme.palette.action.disabled,
    },
    "&:hover": {
        borderLeft: 0,
        borderRight: 0,
        borderBottom: 0,
        borderColor: enabled
            ? theme.palette.primary.main
            : theme.palette.divider,
        "& svg": {
            fill: theme.palette.primary.main,
        },
    },
}));

type IssueActivitiesProps = {
    issueId: string;
};

const IssueActivities: FC<IssueActivitiesProps> = ({ issueId }) => {
    const [listQueryParams, updateListQueryParams] = useListQueryParams({
        sort_by: "time",
    });

    const [sortOrder, setSortOrder] = useState<"oldestFirst" | "newestFirst">(
        "oldestFirst",
    );

    const { data, isLoading: feedLoading } = issueApi.useListIssueFeedQuery({
        id: issueId,
        params: listQueryParams,
    });

    const { data: issueSpentTime, isLoading: spentTimeLoading } =
        issueApi.useGetIssueSpentTimeQuery(issueId);

    const [currentEditingComment, setCurrentEditingComment] =
        useState<CommentT | null>(null);
    const [deleteCommentDialogOpen, setDeleteCommentDialogOpen] =
        useState(false);

    const [displayingActivities, setDisplayingActivities] = useState<
        IssueActivityTypeT[]
    >(["comment", "history"]);

    const handleClickDeleteComment = (comment: CommentT) => {
        setCurrentEditingComment(comment);
        setDeleteCommentDialogOpen(true);
    };

    const handleCloseDeleteCommentDialog = () => {
        setDeleteCommentDialogOpen(false);
        setCurrentEditingComment(null);
    };

    const handleClickActivityType = (type: IssueActivityTypeT) => {
        setDisplayingActivities((prevActivities) =>
            prevActivities.includes(type)
                ? prevActivities.filter((el) => el !== type)
                : [...prevActivities, type],
        );
    };

    const handleChangedSortOrder = useCallback(
        (event: SelectChangeEvent) => {
            const value = event.target.value as "oldestFirst" | "newestFirst";

            setSortOrder(value);
            updateListQueryParams({
                sort_by: value === "oldestFirst" ? "time" : "-time",
                offset: 0,
            });
        },
        [updateListQueryParams],
    );

    const handleClickLoadMore = useCallback(() => {
        updateListQueryParams({
            offset: listQueryParams.offset + listQueryParams.limit,
        });
    }, [listQueryParams, updateListQueryParams]);

    const activities = useMemo(
        () =>
            (data?.payload.items || []).filter((activity) =>
                displayingActivities.includes(activity.type),
            ),
        [data, displayingActivities],
    );
    const rowCount = data?.payload.count || 0;
    const totalSpentTime = issueSpentTime?.payload?.total_spent_time || 0;

    return (
        <Box display="flex" flexDirection="column">
            <Box
                display="flex"
                alignItems="center"
                borderTop={1}
                borderColor="divider"
            >
                <Tooltip title={t("issues.comments.title")} placement="top">
                    <ActivityTypeButton
                        onClick={() => handleClickActivityType("comment")}
                        enabled={displayingActivities.includes("comment")}
                        variant="outlined"
                        size="small"
                    >
                        <CommentIcon />
                    </ActivityTypeButton>
                </Tooltip>

                <Tooltip title={t("issues.history.title")} placement="top">
                    <ActivityTypeButton
                        onClick={() => handleClickActivityType("history")}
                        enabled={displayingActivities.includes("history")}
                        variant="outlined"
                        size="small"
                    >
                        <HistoryIcon />
                    </ActivityTypeButton>
                </Tooltip>

                <Box flex={1} />

                <Box display="flex" alignItems="center" gap={1}>
                    {totalSpentTime > 0 && (
                        <Typography fontSize={14} fontWeight="bold">
                            {t("issues.spentTime.total")}:{" "}
                            {formatSpentTime(totalSpentTime)}
                        </Typography>
                    )}

                    <Select
                        sx={(theme) => ({
                            "& .MuiSelect-select": {
                                p: theme.spacing(0.5),
                                fontSize: 14,
                                fontWeight: "bold",
                            },
                        })}
                        value={sortOrder}
                        onChange={handleChangedSortOrder}
                        variant="standard"
                        size="small"
                    >
                        <MenuItem value="oldestFirst">
                            {t("issues.activities.oldestFirst")}
                        </MenuItem>
                        <MenuItem value="newestFirst">
                            {t("issues.activities.newestFirst")}
                        </MenuItem>
                    </Select>
                </Box>
            </Box>

            <Box pl={1} my={2}>
                <CreateCommentForm issueId={issueId} />
            </Box>

            {(feedLoading || spentTimeLoading) && (
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
                displayingActivities.length > 0 && (
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
                issueId={issueId}
                open={deleteCommentDialogOpen}
                comment={currentEditingComment}
                onClose={handleCloseDeleteCommentDialog}
            />
        </Box>
    );
};

export { IssueActivities };
