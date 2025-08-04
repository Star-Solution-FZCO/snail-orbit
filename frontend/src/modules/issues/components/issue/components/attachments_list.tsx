import AttachFileIcon from "@mui/icons-material/AttachFile";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GridViewIcon from "@mui/icons-material/GridView";
import HighlightAltIcon from "@mui/icons-material/HighlightAlt";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import ListIcon from "@mui/icons-material/List";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import {
    Box,
    Collapse,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    Stack,
    styled,
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
import { AttachmentCard } from "./attachment_cards";
import { AttachmentListItem } from "./attachment_list_item";
import { DeleteAttachmentDialog } from "./delete_attachment_dialog";

const CustomMenuItem = styled(MenuItem)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
}));

type AttachmentsListProps = {
    attachments: IssueAttachmentT[];
    projectId?: string;
    onUpload: (
        attachment: IssueAttachmentBodyT[],
    ) => Promise<unknown> | unknown;
    onDelete: (attachments: IssueAttachmentT[]) => Promise<unknown> | unknown;
};

const AttachmentsList: FC<AttachmentsListProps> = ({
    projectId,
    attachments,
    onUpload,
    onDelete,
}) => {
    const { t } = useTranslation();

    const { uploadAttachment, downloadAttachment } = useAttachmentOperations({
        projectId: projectId,
    });

    const [displayMode, setDisplayMode] = useLSState<"card" | "list">(
        "ISSUES_ATTACHMENTS_DISPLAY_MODE",
        "card",
    );
    const [attachmentsExpanded, setAttachmentsExpanded] = useState(true);
    const [selectedAttachment, setSelectedAttachment] =
        useState<SelectedAttachmentT>(initialSelectedAttachment);
    const [selectedAttachmentIdList, setSelectedAttachmentIdList] = useState<
        string[]
    >([]);
    const [selectionEnabled, setSelectionEnabled] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [deleteMode, setDeleteMode] = useState<"single" | "multi" | "all">(
        "single",
    );

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            const newAttachments = await Promise.all(
                acceptedFiles.map(uploadAttachment),
            );

            onUpload(newAttachments);
        },
        [uploadAttachment, onUpload],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
    });

    const handleClickMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleToggleSelection = () => {
        if (selectionEnabled) {
            setSelectedAttachmentIdList([]);
        }
        setSelectionEnabled((prev) => !prev);
        handleCloseMenu();
    };

    const handleToggleSelectAttachment = (id: string) => {
        setSelectedAttachmentIdList((prev) =>
            prev.includes(id)
                ? prev.filter((selectedId) => selectedId !== id)
                : [...prev, id],
        );
    };

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

    const handleClickDeleteIssueAttachment = (id: string, filename: string) => {
        setDeleteMode("single");
        setSelectedAttachment({ id, filename });
        setOpenDeleteDialog(true);
    };

    const deleteAttachments = () => {
        let attachmentsToDelete: IssueAttachmentT[] = [];

        if (deleteMode === "single") {
            if (!selectedAttachment.id) return;

            const targetAttachment = attachments.find(
                (el) => el.id === selectedAttachment.id,
            );
            if (targetAttachment) attachmentsToDelete = [targetAttachment];
        } else if (deleteMode === "multi") {
            attachmentsToDelete = attachments.filter((attachment) =>
                selectedAttachmentIdList.includes(attachment.id),
            );
        } else if (deleteMode === "all") {
            attachmentsToDelete = [...attachments];
        }

        if (attachmentsToDelete.length > 0) {
            onDelete(attachmentsToDelete);
        }

        setOpenDeleteDialog(false);
        setSelectedAttachmentIdList([]);
        setSelectionEnabled(false);
    };

    const handleClickDeleteSelectedAttachments = () => {
        setDeleteMode("multi");
        setSelectedAttachment({ id: "", filename: "" });
        setOpenDeleteDialog(true);
    };

    const handleClickDeleteAllIssueAttachments = () => {
        setDeleteMode("all");
        setSelectedAttachment({ id: "", filename: "" });
        setOpenDeleteDialog(true);
        handleCloseMenu();
    };

    useEffect(() => {
        window.addEventListener("paste", handlePaste);

        return () => {
            window.removeEventListener("paste", handlePaste);
        };
    }, [handlePaste]);

    const attachmentsExists = attachments.length > 0;

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
                                ({attachments.length})
                            </Typography>
                        </Typography>
                    </Box>

                    <Stack direction="row" alignItems="center" gap={1}>
                        {selectedAttachmentIdList.length > 0 && (
                            <Tooltip
                                title={t("issues.attachments.deleteSelected")}
                            >
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={
                                        handleClickDeleteSelectedAttachments
                                    }
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}

                        <IconButton onClick={handleClickMenu} size="small">
                            <MoreHorizIcon fontSize="small" />
                        </IconButton>
                    </Stack>

                    <Menu
                        open={Boolean(anchorEl)}
                        anchorEl={anchorEl}
                        onClose={handleCloseMenu}
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "right",
                        }}
                        transformOrigin={{
                            vertical: "top",
                            horizontal: "right",
                        }}
                    >
                        <CustomMenuItem
                            onClick={() => {
                                setDisplayMode(
                                    displayMode === "card" ? "list" : "card",
                                );
                                handleCloseMenu();
                            }}
                        >
                            {displayMode === "card" ? (
                                <ListIcon fontSize="small" />
                            ) : (
                                <GridViewIcon fontSize="small" />
                            )}

                            <Typography>
                                {t(
                                    displayMode === "card"
                                        ? "issues.form.attachments.listView"
                                        : "issues.form.attachments.thumbnailView",
                                )}
                            </Typography>
                        </CustomMenuItem>

                        <CustomMenuItem onClick={handleToggleSelection}>
                            {selectionEnabled ? (
                                <HighlightOffIcon fontSize="small" />
                            ) : (
                                <HighlightAltIcon fontSize="small" />
                            )}

                            <Typography>
                                {selectionEnabled
                                    ? t("issues.attachments.disableSelection")
                                    : t("issues.attachments.enableSelection")}
                            </Typography>
                        </CustomMenuItem>

                        <Divider />

                        <CustomMenuItem
                            onClick={handleClickDeleteAllIssueAttachments}
                        >
                            <DeleteIcon fontSize="small" />

                            <Typography>
                                {t("issues.attachments.deleteAll")}
                            </Typography>
                        </CustomMenuItem>
                    </Menu>
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
                                    onSelect={handleToggleSelectAttachment}
                                    selectionEnabled={selectionEnabled}
                                    selected={selectedAttachmentIdList.includes(
                                        attachment.id,
                                    )}
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
                                    onSelect={handleToggleSelectAttachment}
                                    onDelete={() =>
                                        handleClickDeleteIssueAttachment(
                                            attachment.id,
                                            attachment.name,
                                        )
                                    }
                                    onDownload={downloadAttachment}
                                    selectionEnabled={selectionEnabled}
                                    selected={selectedAttachmentIdList.includes(
                                        attachment.id,
                                    )}
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
                onDelete={deleteAttachments}
                deleteMode={deleteMode}
            />
        </Box>
    );
};

export { AttachmentsList };
