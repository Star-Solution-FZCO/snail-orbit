import CloseIcon from "@mui/icons-material/Close";
import CommentIcon from "@mui/icons-material/Comment";
import HistoryIcon from "@mui/icons-material/History";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    styled,
    Tooltip,
    Typography,
} from "@mui/material";
import { t } from "i18next";
import { FC, useMemo, useState } from "react";
import { issueApi } from "store";
import { CommentT, IssueActivityTypeT, IssueHistoryT } from "types";
import { formatSpentTime, noLimitListQueryParams, toastApiError } from "utils";
import { mergeActivityRecords } from "../utils";
import { CommentCard } from "./comment_card";
import { CreateCommentForm } from "./create_comment_form";
import { IssueHistory } from "./issue_history";

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

interface IDeleteCommentDialogProps {
    issueId: string;
    open: boolean;
    comment: CommentT | null;
    onClose: () => void;
}

const DeleteCommentDialog: FC<IDeleteCommentDialogProps> = ({
    issueId,
    open,
    comment,
    onClose,
}) => {
    const [deleteComment, { isLoading }] =
        issueApi.useDeleteIssueCommentMutation();

    const handleClickDelete = () => {
        if (!comment) return;

        deleteComment({ id: issueId, commentId: comment.id })
            .unwrap()
            .then(onClose)
            .catch(toastApiError);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {t("issues.comments.delete.title")}

                <IconButton onClick={onClose} size="small" disabled={isLoading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>{t("issues.comments.delete.warning")}</DialogContent>
            <DialogActions>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="error"
                    disabled={isLoading}
                >
                    {t("cancel")}
                </Button>
                <LoadingButton
                    onClick={handleClickDelete}
                    variant="outlined"
                    loading={isLoading}
                >
                    {t("delete")}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

interface IIssueActivitiesProps {
    issueId: string;
}

const IssueActivities: FC<IIssueActivitiesProps> = ({ issueId }) => {
    const { data: commentsData, isLoading: commentsLoading } =
        issueApi.useListIssueCommentsQuery({
            id: issueId,
        });

    const { data: historyData, isLoading: historyLoading } =
        issueApi.useListIssueHistoryQuery({
            id: issueId,
            params: noLimitListQueryParams,
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

    const comments = commentsData?.payload.items || [];
    const historyRecords = historyData?.payload.items || [];

    const totalSpentTime = issueSpentTime?.total_spent_time || 0;

    const activities = useMemo(
        () =>
            mergeActivityRecords(
                comments,
                historyRecords,
                displayingActivities,
            ),
        [comments, historyRecords, displayingActivities],
    );

    return (
        <Box display="flex" flexDirection="column">
            {totalSpentTime > 0 && (
                <Typography fontSize={14} fontWeight="bold" mb={1}>
                    {t("issues.spentTime.total")}:{" "}
                    {formatSpentTime(totalSpentTime)}
                </Typography>
            )}

            <Box display="flex" borderTop={1} borderColor="divider">
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
            </Box>

            <Box pl={1} my={2}>
                <CreateCommentForm issueId={issueId} />
            </Box>

            {(commentsLoading || spentTimeLoading || historyLoading) && (
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
