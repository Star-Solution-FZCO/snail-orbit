import CloseIcon from "@mui/icons-material/Close";
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
    Typography,
} from "@mui/material";
import { t } from "i18next";
import { FC, useState } from "react";
import { issueApi } from "store";
import { CommentT } from "types";
import { formatErrorMessages, toastApiError } from "utils";
import { CommentCard } from "./comment_card";
import { CreateCommentForm } from "./create_comment_form";

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

interface IIssueCommentsProps {
    issueId: string;
}

const IssueComments: FC<IIssueCommentsProps> = ({ issueId }) => {
    const { data, isLoading, error } = issueApi.useListIssueCommentsQuery({
        id: issueId,
    });

    const [currentEditingComment, setCurrentEditingComment] =
        useState<CommentT | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const handleClickDeleteComment = (comment: CommentT) => {
        setCurrentEditingComment(comment);
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setCurrentEditingComment(null);
    };

    const comments = data?.payload.items || [];

    return (
        <Box display="flex" flexDirection="column">
            <Box pl={1} mb={2}>
                <CreateCommentForm issueId={issueId} />
            </Box>

            {error && (
                <Typography fontSize={24} fontWeight="bold">
                    {formatErrorMessages(error) ||
                        t("issues.comments.fetch.error")}
                </Typography>
            )}

            {isLoading && (
                <Box display="flex" justifyContent="center">
                    <CircularProgress color="inherit" size={20} />
                </Box>
            )}

            <Box display="flex" flexDirection="column" gap={1}>
                {comments.map((comment) => (
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
                ))}
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

export { IssueComments };
