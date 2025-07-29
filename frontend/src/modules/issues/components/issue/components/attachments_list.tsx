import AttachFileIcon from "@mui/icons-material/AttachFile";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GridViewIcon from "@mui/icons-material/GridView";
import ListIcon from "@mui/icons-material/List";
import {
    Box,
    Collapse,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import { useAttachmentOperations } from "entities/issue/api/use_attachment_operations";
import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import type {
    IssueAttachmentBodyT,
    IssueAttachmentT,
    SelectedAttachmentT,
} from "shared/model/types";
import { useLSState } from "shared/utils/helpers/local-storage";
import { initialSelectedAttachment } from "../../../utils";
import { AttachmentCard, BrowserFileCard } from "./attachment_cards";
import { AttachmentListItem } from "./attachment_list_item";
import { DeleteAttachmentDialog } from "./delete_attachment_dialog";

type AttachmentsListProps = {
    attachments: IssueAttachmentT[];
    projectId?: string;
    onUpload: (
        attachment: IssueAttachmentBodyT[],
    ) => Promise<unknown> | unknown;
    onDelete: (attachment: IssueAttachmentT) => Promise<unknown> | unknown;
};

const AttachmentsList: FC<AttachmentsListProps> = ({
    projectId,
    attachments,
    onDelete,
    onUpload,
}) => {
    const { t } = useTranslation();

    const { uploadAttachment, downloadAttachment } = useAttachmentOperations({
        projectId: projectId,
    });

    const [displayMode, setDisplayMode] = useLSState<"card" | "list">(
        "ISSUES_ATTACHMENTS_DISPLAY_MODE",
        "card",
    );
    const [files, setFiles] = useState<File[]>([]);
    const [attachmentsExpanded, setAttachmentsExpanded] = useState(true);
    const [selectedAttachment, setSelectedAttachment] =
        useState<SelectedAttachmentT>(initialSelectedAttachment);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            const newAttachments = await Promise.all(
                acceptedFiles.map(uploadAttachment),
            );

            onUpload(newAttachments);
        },
        [uploadAttachment, onUpload],
    );

    const handlePaste = useCallback(
        async (event: ClipboardEvent) => {
            const clipboardItems = event.clipboardData?.items;
            if (!clipboardItems) return;

            const hasFiles = Array.from(clipboardItems).some(
                (item) => item.kind === "file",
            );

            if (!hasFiles) return;

            event.stopPropagation();
            event.preventDefault();

            for (let i = 0; i < clipboardItems.length; i++) {
                const item = clipboardItems[i];

                if (item.kind === "file") {
                    const file = item.getAsFile();

                    if (!file) continue;

                    const attachment = await uploadAttachment(file);

                    onUpload([attachment]);
                }
            }
        },
        [uploadAttachment, onUpload],
    );

    const handleClickDeleteBrowserFile = (index: number, filename: string) => {
        setSelectedAttachment({ id: index, filename, type: "browser" });
        setOpenDeleteDialog(true);
    };

    const handleClickDeleteIssueAttachment = (id: string, filename: string) => {
        setSelectedAttachment({ id, filename, type: "server" });
        setOpenDeleteDialog(true);
    };

    const deleteBrowserFile = () => {
        if (!selectedAttachment) return;
        if (selectedAttachment.type !== "browser") return;

        setFiles((prevFiles) =>
            prevFiles.filter((_, i) => i !== selectedAttachment.id),
        );
        setOpenDeleteDialog(false);
    };

    const deleteAttachment = () => {
        if (!selectedAttachment) return;
        if (selectedAttachment.type !== "server") return;

        const targetAttachment = attachments.find(
            (el) => el.id === selectedAttachment.id,
        );
        if (targetAttachment) onDelete(targetAttachment);

        setOpenDeleteDialog(false);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
    });

    useEffect(() => {
        window.addEventListener("paste", handlePaste);

        return () => {
            window.removeEventListener("paste", handlePaste);
        };
    }, [handlePaste]);

    const attachmentsExists = files.length > 0 || attachments.length > 0;

    return (
        <Box display="flex" flexDirection="column">
            {attachmentsExists && (
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={0.5}
                    width={1}
                    mb={1}
                >
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <IconButton
                            sx={{ p: 0 }}
                            onClick={() =>
                                setAttachmentsExpanded(!attachmentsExpanded)
                            }
                            size="small"
                        >
                            <ExpandMoreIcon
                                sx={{
                                    transform: attachmentsExpanded
                                        ? "rotate(180deg)"
                                        : "rotate(0)",
                                    transition: "transform 0.2s",
                                }}
                                fontSize="small"
                            />
                        </IconButton>

                        <Typography fontWeight="bold">
                            {t("issues.form.attachments.title")}{" "}
                            <Typography component="span" color="text.secondary">
                                ({files.length + attachments.length})
                            </Typography>
                        </Typography>
                    </Box>

                    <Tooltip
                        title={t(
                            displayMode === "card"
                                ? "issues.form.attachments.listView"
                                : "issues.form.attachments.cardView",
                        )}
                    >
                        <IconButton
                            onClick={() =>
                                setDisplayMode(
                                    displayMode === "card" ? "list" : "card",
                                )
                            }
                            size="small"
                        >
                            {displayMode === "card" ? (
                                <ListIcon fontSize="small" />
                            ) : (
                                <GridViewIcon fontSize="small" />
                            )}
                        </IconButton>
                    </Tooltip>
                </Box>
            )}

            <Box
                {...getRootProps()}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    borderWidth: 1,
                    borderStyle: "dashed",
                    borderColor: isDragActive ? "primary.main" : "grey.600",
                    borderRadius: 0.5,
                    backgroundColor: isDragActive
                        ? "action.selected"
                        : "transparent",
                    p: 1,
                    cursor: "pointer",
                }}
            >
                <input {...getInputProps()} />

                <AttachFileIcon />

                <Typography>
                    {t("issues.form.attachments.dragFileHere")}
                </Typography>
            </Box>

            {attachmentsExists && (
                <Collapse in={attachmentsExpanded}>
                    {displayMode === "card" && (
                        <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                            {attachments.map((attachment) => (
                                <AttachmentCard
                                    key={attachment.id}
                                    attachment={attachment}
                                    onDelete={() =>
                                        handleClickDeleteIssueAttachment(
                                            attachment.id,
                                            attachment.name,
                                        )
                                    }
                                    onDownload={downloadAttachment}
                                />
                            ))}

                            {files.map((file, index) => (
                                <BrowserFileCard
                                    key={`${file.name}-${index}`}
                                    file={file}
                                    onDelete={() =>
                                        handleClickDeleteBrowserFile(
                                            index,
                                            file.name,
                                        )
                                    }
                                />
                            ))}
                        </Box>
                    )}

                    {displayMode === "list" && (
                        <Stack mt={1} gap={1}>
                            {attachments.map((attachment) => (
                                <AttachmentListItem
                                    key={attachment.id}
                                    attachment={attachment}
                                    onDelete={() =>
                                        handleClickDeleteIssueAttachment(
                                            attachment.id,
                                            attachment.name,
                                        )
                                    }
                                    onDownload={downloadAttachment}
                                />
                            ))}
                        </Stack>
                    )}
                </Collapse>
            )}

            <DeleteAttachmentDialog
                open={openDeleteDialog}
                filename={selectedAttachment.filename}
                onClose={() => setOpenDeleteDialog(false)}
                onDelete={
                    selectedAttachment.type === "browser"
                        ? deleteBrowserFile
                        : deleteAttachment
                }
            />
        </Box>
    );
};

export { AttachmentsList };
