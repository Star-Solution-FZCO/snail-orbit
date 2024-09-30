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
} from "@mui/material";
import { t } from "i18next";
import { FC, useMemo, useState } from "react";
import { issueApi } from "store";
import { CommentT, IssueActivityTypeT, IssueHistoryT } from "types";
import { noLimitListQueryParams, toastApiError } from "utils";
import { mergeCommentsAndHistoryRecords } from "../utils";
import { CommentCard } from "./comment_card";
import { CreateCommentForm } from "./create_comment_form";
import { IssueHistory } from "./issue_history";

const ActivityTypeButton = styled(Button)<{ enabled?: boolean }>(
    ({ theme, enabled }) => ({
        borderRadius: 0,
        borderLeft: 0,
        borderRight: 0,
        borderBottom: 0,
        borderColor: enabled
            ? theme.palette.primary.main
            : theme.palette.divider,
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
    }),
);

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

    const [currentEditingComment, setCurrentEditingComment] =
        useState<CommentT | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [displayingActivities, setDisplayingActivities] = useState<
        IssueActivityTypeT[]
    >(["comment", "history"]);

    const handleClickDeleteComment = (comment: CommentT) => {
        setCurrentEditingComment(comment);
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
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

    const activities = useMemo(
        () =>
            mergeCommentsAndHistoryRecords(
                comments,
                historyRecords,
                displayingActivities,
            ),
        [comments, historyRecords, displayingActivities],
    );

    return (
        <Box display="flex" flexDirection="column">
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

            {(commentsLoading || historyLoading) && (
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
                                    !deleteDialogOpen
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
                open={deleteDialogOpen}
                comment={currentEditingComment}
                onClose={handleCloseDeleteDialog}
            />
        </Box>
    );
};

export { IssueActivities };
