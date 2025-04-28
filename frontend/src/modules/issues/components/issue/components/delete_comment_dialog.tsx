import CloseIcon from "@mui/icons-material/Close";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
} from "@mui/material";
import { t } from "i18next";
import type { FC } from "react";
import type { CommentT } from "shared/model/types";
import { issueApi } from "shared/model";
import { toastApiError } from "shared/utils";

type IDeleteCommentDialogProps = {
    issueId: string;
    open: boolean;
    comment: CommentT | null;
    onClose: () => void;
};

export const DeleteCommentDialog: FC<IDeleteCommentDialogProps> = ({
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
                <Button
                    onClick={handleClickDelete}
                    variant="outlined"
                    loading={isLoading}
                >
                    {t("delete")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
