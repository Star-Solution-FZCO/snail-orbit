import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CommentT, SelectedAttachmentT } from "shared/model/types";
import type { IssueCommentUpdate } from "shared/model/types/backend-schema.gen";
import { toastApiError } from "shared/utils";
import { useAttachmentOperations } from "../../../../api/use_attachment_operations";
import { useCommentOperations } from "../../../../api/use_comment_operations";
import { initialSelectedAttachment } from "../../../../utils";
import { DeleteAttachmentDialog } from "../delete_attachment_dialog";
import { CommentCardEdit } from "./comment_card_edit";
import { CommentCardView } from "./comment_card_view";

dayjs.extend(relativeTime);
dayjs.extend(utc);

type CommentCardProps = {
    issueId: string;
    projectId?: string;
    comment: CommentT;
    onEdit: (comment: CommentT) => void;
    onCancel: () => void;
    onDelete: (comment: CommentT) => void;
    isEditing: boolean;
};

const CommentCard: FC<CommentCardProps> = ({
    issueId,
    projectId,
    comment,
    onEdit,
    onCancel,
    onDelete,
    isEditing,
}) => {
    const { t } = useTranslation();

    const { getCommentText, updateComment, isLoading, isCommentUpdateLoading } =
        useCommentOperations({
            projectId,
        });

    const { uploadAttachment, downloadAttachment } = useAttachmentOperations({
        projectId,
    });

    const [commentText, setCommentText] = useState<string>("");
    const [commentTextLoading, setCommentTextLoading] = useState(true);

    const [selectedAttachment, setSelectedAttachment] =
        useState<SelectedAttachmentT>(initialSelectedAttachment);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    useEffect(() => {
        setCommentTextLoading(true);
        getCommentText(comment).then((res) => {
            setCommentText(res || comment.text?.value || "");
            setCommentTextLoading(false);
        });
    }, [comment, getCommentText]);

    const handleClickSave = (params: IssueCommentUpdate) => {
        updateComment({
            id: issueId,
            commentId: comment.id,
            ...params,
        }).catch(toastApiError);
    };

    const handleClickDeleteAttachment = (id: string, filename: string) => {
        setSelectedAttachment({ id, filename, type: "server" });
        setOpenDeleteDialog(true);
    };

    const deleteAttachment = () => {
        if (!selectedAttachment) return;
        if (selectedAttachment.type !== "server") return;

        updateComment({
            id: issueId,
            commentId: comment.id,
            attachments: comment.attachments.filter(
                (attachment) => attachment.id !== selectedAttachment.id,
            ),
        })
            .then(() => {
                setOpenDeleteDialog(false);
            })
            .catch(toastApiError);
    };

    return (
        <>
            {!isEditing ? (
                <CommentCardView
                    comment={comment}
                    commentText={
                        commentTextLoading
                            ? t("commentCard.textLoading")
                            : commentText
                    }
                    onDeleteAttachment={handleClickDeleteAttachment}
                    onDeleteClick={onDelete}
                    onEditClick={onEdit}
                    isLoading={
                        isLoading ||
                        commentTextLoading ||
                        isCommentUpdateLoading
                    }
                    onDownloadAttachment={downloadAttachment}
                />
            ) : (
                <CommentCardEdit
                    comment={comment}
                    commentText={commentText}
                    onDeleteAttachment={handleClickDeleteAttachment}
                    onClose={onCancel}
                    updateComment={handleClickSave}
                    isLoading={isLoading || isCommentUpdateLoading}
                    onUploadAttachment={uploadAttachment}
                    onDownloadAttachment={downloadAttachment}
                />
            )}

            <DeleteAttachmentDialog
                open={openDeleteDialog}
                filename={selectedAttachment.filename}
                onClose={() => setOpenDeleteDialog(false)}
                onDelete={deleteAttachment}
                loading={isLoading}
            />
        </>
    );
};

export { CommentCard };
