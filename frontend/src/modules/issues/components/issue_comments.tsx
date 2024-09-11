import CloseIcon from "@mui/icons-material/Close";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
} from "@mui/material";
import { t } from "i18next";
import { FC, useState } from "react";
import { issueApi } from "store";
import { CommentT } from "types";
import { toastApiError } from "utils";
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

                <IconButton
                    sx={{ p: 0 }}
                    onClick={onClose}
                    size="small"
                    disabled={isLoading}
                >
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
    comments: CommentT[];
}

const IssueComments: FC<IIssueCommentsProps> = ({ issueId, comments }) => {
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

    return (
        <Box display="flex" flexDirection="column">
            <Box pl={1} mb={3}>
                <CreateCommentForm issueId={issueId} />
            </Box>

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
