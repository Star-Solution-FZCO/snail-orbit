import AttachFileIcon from "@mui/icons-material/AttachFile";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LinkIcon from "@mui/icons-material/Link";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    SxProps,
    Theme,
    Tooltip,
    Typography,
    useTheme,
} from "@mui/material";
import { useLocation } from "@tanstack/react-router";
import MDEditor from "@uiw/react-md-editor";
import { UserAvatar } from "components";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { issueApi, sharedApi, useAppSelector } from "store";
import { CommentT, SelectedAttachmentT } from "types";
import { toastApiError } from "utils";
import { initialSelectedAttachment, useUploadToast } from "../utils";
import { AttachmentCard } from "./attachment_cards";
import { DeleteAttachmentDialog } from "./delete_attachment_dialog";
import { HiddenInput } from "./hidden_input";

dayjs.extend(relativeTime);
dayjs.extend(utc);

const iconStyles = (hoverColor: string): SxProps<Theme> => ({
    "&:hover": {
        cursor: "pointer",
        fill: hoverColor,
    },
});

interface IActionButtonsProps {
    comment: CommentT;
    isOwner: boolean;
    onEdit: (comment: CommentT) => void;
    onDelete: (comment: CommentT) => void;
}

const ActionButtons: FC<IActionButtonsProps> = ({
    comment,
    isOwner,
    onEdit,
    onDelete,
}) => {
    const { t } = useTranslation();

    const handleClickCopyLink = () => {
        const pageUrl = `${window.location.protocol + "//" + window.location.hostname + window.location.pathname + window.location.port}`;
        const commentUrl = `${pageUrl}#comment-${comment.id}`;

        navigator.clipboard
            .writeText(commentUrl)
            .then(() => {
                toast.success(t("copyLink.success"));
            })
            .catch((err) => {
                console.error("Failed to copy the link: ", err);
                toast.error(t("copyLink.error"));
            });
    };

    return (
        <Box
            className="actions"
            sx={{
                display: "none",
                alignItems: "center",
                gap: 1,
            }}
        >
            {isOwner && (
                <EditIcon
                    sx={(theme) => ({
                        ...iconStyles(theme.palette.primary.main),
                    })}
                    onClick={() => onEdit(comment)}
                    fontSize="small"
                />
            )}

            <LinkIcon
                sx={(theme) => ({ ...iconStyles(theme.palette.info.main) })}
                onClick={handleClickCopyLink}
            />

            {isOwner && (
                <DeleteIcon
                    sx={(theme) => ({
                        ...iconStyles(theme.palette.error.main),
                    })}
                    onClick={() => onDelete(comment)}
                    fontSize="small"
                />
            )}
        </Box>
    );
};

interface ICommentCardProps {
    issueId: string;
    comment: CommentT;
    onEdit: (comment: CommentT) => void;
    onCancel: () => void;
    onDelete: (comment: CommentT) => void;
    isEditing: boolean;
}

const CommentCard: FC<ICommentCardProps> = ({
    issueId,
    comment,
    onEdit,
    onCancel,
    onDelete,
    isEditing,
}) => {
    const { t } = useTranslation();
    const location = useLocation();
    const theme = useTheme();

    const user = useAppSelector((state) => state.profile.user);

    const [text, setText] = useState<string>(comment.text || "");
    const [selectedAttachment, setSelectedAttachment] =
        useState<SelectedAttachmentT>(initialSelectedAttachment);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    const [updateComment, { isLoading }] =
        issueApi.useUpdateIssueCommentMutation();
    const [uploadAttachment] = sharedApi.useUploadAttachmentMutation();

    const { toastId, showToast, updateToast, activeMutations } =
        useUploadToast();

    const handleClickSave = () => {
        updateComment({
            id: issueId,
            commentId: comment.id,
            text,
        })
            .unwrap()
            .then(onCancel)
            .catch(toastApiError);
    };

    const handleChangeFileInput = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        if (!event.target.files) return;

        const file = event.target.files[0];
        const formData = new FormData();
        formData.append("file", file);

        if (!toastId.current[file.name]) {
            showToast(file.name);
        }

        try {
            const mutation = uploadAttachment(formData);
            activeMutations.current[file.name] = mutation;
            const response = await mutation.unwrap();

            await updateComment({
                id: issueId,
                commentId: comment.id,
                attachments: [
                    ...comment.attachments.map((a) => a.id),
                    response.payload.id,
                ],
            });

            updateToast(
                file.name,
                t("issues.form.attachments.upload.success"),
                "success",
                3000,
            );
        } catch (error: any) {
            if (error.name !== "AbortError") {
                toastApiError(error);
                updateToast(
                    file.name,
                    t("issues.form.attachments.upload.error"),
                    "error",
                    3000,
                );
            }
        }
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
            attachments: comment.attachments
                .filter((attachment) => attachment.id !== selectedAttachment.id)
                .map((a) => a.id),
        })
            .unwrap()
            .then(() => {
                setOpenDeleteDialog(false);
            })
            .catch(toastApiError);
    };

    useEffect(() => {
        const hash = location.hash;

        if (hash === `comment-${comment.id}`) {
            const element = document.getElementById(`comment-${comment.id}`);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
                element.focus();
            }
        }
    }, [location.hash, comment.id]);

    const author = comment.author;
    const isOwner = user?.id === author.id;
    const attachmentsExists = comment.attachments.length > 0;

    const renderViewMode = () => (
        <Box
            id={`comment-${comment.id}`}
            tabIndex={-1}
            sx={{
                display: "flex",
                gap: 2,
                px: 1,
                py: 0.5,
                borderRadius: 0.5,
                "&:focus": {
                    backgroundColor: "action.focus",
                    outline: "none",
                },
                "&:hover": {
                    backgroundColor: "action.hover",
                    "& .actions": {
                        display: "flex",
                    },
                },
            }}
        >
            <UserAvatar src={author.avatar} size={32} />

            <Box width="100%" fontSize={14}>
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={1}
                >
                    <Box
                        height="24px"
                        display="flex"
                        alignItems="center"
                        gap={1}
                    >
                        <Typography fontSize="inherit">
                            {author.name}
                        </Typography>

                        <Tooltip
                            title={dayjs
                                .utc(comment.created_at)
                                .local()
                                .format("DD MMM YYYY HH:mm")}
                            placement="top"
                        >
                            <Typography
                                fontSize="inherit"
                                color="text.secondary"
                            >
                                {t("issues.comments.commented")}{" "}
                                {dayjs
                                    .utc(comment.created_at)
                                    .local()
                                    .fromNow()}
                            </Typography>
                        </Tooltip>
                    </Box>

                    <ActionButtons
                        comment={comment}
                        isOwner={isOwner}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                </Box>

                <MDEditor.Markdown
                    source={comment.text || ""}
                    style={{
                        whiteSpace: "pre-wrap",
                        fontSize: "inherit",
                        color: theme.palette.text.primary,
                        backgroundColor: "transparent",
                    }}
                />

                {attachmentsExists && (
                    <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                        {comment.attachments.map((attachment) => (
                            <AttachmentCard
                                key={attachment.id}
                                attachment={attachment}
                                onDelete={() =>
                                    handleClickDeleteAttachment(
                                        attachment.id,
                                        attachment.name,
                                    )
                                }
                            />
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );

    const renderEditMode = () => (
        <Box display="flex" flexDirection="column" pl={1} py={0.5}>
            <Box display="flex" gap={2}>
                <UserAvatar src={author.avatar} size={32} />

                <Box display="flex" flexDirection="column" gap={1} flex={1}>
                    <Box minHeight="85px">
                        <MDEditor
                            value={text}
                            onChange={(value) => setText(value || "")}
                            textareaProps={{
                                placeholder: t("issues.comments.write"),
                            }}
                            height="100%"
                            minHeight={74}
                            autoFocus
                        />
                    </Box>

                    <Box display="flex" gap={1}>
                        <LoadingButton
                            onClick={handleClickSave}
                            variant="outlined"
                            size="small"
                            disabled={!text}
                            loading={isLoading}
                        >
                            {t("save")}
                        </LoadingButton>

                        <Button
                            component="label"
                            startIcon={<AttachFileIcon />}
                            variant="outlined"
                            size="small"
                            color="secondary"
                        >
                            {t("issues.comments.attachFile")}

                            <HiddenInput
                                type="file"
                                onChange={handleChangeFileInput}
                                multiple={false}
                            />
                        </Button>

                        <Button
                            onClick={onCancel}
                            variant="outlined"
                            size="small"
                            color="error"
                        >
                            {t("cancel")}
                        </Button>
                    </Box>
                </Box>
            </Box>

            {attachmentsExists && (
                <Box display="flex" flexWrap="wrap" gap={1} mt={1} ml={6}>
                    {comment.attachments.map((attachment) => (
                        <AttachmentCard
                            key={attachment.id}
                            attachment={attachment}
                            onDelete={() =>
                                handleClickDeleteAttachment(
                                    attachment.id,
                                    attachment.name,
                                )
                            }
                        />
                    ))}
                </Box>
            )}
        </Box>
    );

    return (
        <>
            {isEditing ? renderEditMode() : renderViewMode()}

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
