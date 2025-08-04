import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { Box, Checkbox, IconButton, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import type { FC } from "react";
import { useAppSelector } from "shared/model";
import { IssueAttachmentT } from "shared/model/types";
import { useLightbox, UserAvatar } from "shared/ui";
import { formatBytes } from "shared/utils";
import { makeFileUrl } from "shared/utils/helpers/make-file-url";

interface IAttachmentListItemProps {
    attachment: IssueAttachmentT;
    onSelect: (id: string) => void;
    onDelete: () => void;
    onDownload: (attachment: IssueAttachmentT) => void;
    selectionEnabled: boolean;
    selected: boolean;
}

export const AttachmentListItem: FC<IAttachmentListItemProps> = ({
    attachment,
    onSelect,
    onDelete,
    onDownload,
    selectionEnabled = false,
    selected = false,
}) => {
    const { open } = useLightbox();

    const user = useAppSelector((state) => state.profile.user);

    const fileUrl = makeFileUrl(attachment.id);

    const isImage = attachment.content_type.startsWith("image/");

    const canDelete = user?.id === attachment.author.id;

    return (
        <Stack
            direction="row"
            alignItems="center"
            p={1}
            border={1}
            borderColor="divider"
            borderRadius={1}
            gap={1}
        >
            {selectionEnabled && (
                <Checkbox
                    sx={{ flexShrink: 0 }}
                    checked={selected}
                    onChange={() => onSelect(attachment.id)}
                    size="small"
                />
            )}

            {isImage ? (
                <Box
                    component="img"
                    src={fileUrl}
                    sx={{
                        width: 40,
                        height: 40,
                        cursor: "pointer",
                        objectFit: "cover",
                    }}
                    onClick={() =>
                        open({
                            id: attachment.id,
                            src: fileUrl,
                            name: attachment.name,
                            size: attachment.size,
                            content_type: attachment.content_type,
                        })
                    }
                />
            ) : (
                <Stack
                    width={40}
                    height={40}
                    alignItems="center"
                    justifyContent="center"
                    border={1}
                    borderColor="divider"
                    borderRadius={1}
                >
                    <InsertDriveFileIcon />
                </Stack>
            )}

            <Stack gap={0.5} justifyContent="center">
                <Typography variant="body2">
                    {attachment.name} ({formatBytes(attachment.size)})
                </Typography>

                <Stack direction="row" gap={0.5} alignItems="center">
                    <UserAvatar src={attachment.author.avatar} size={16} />

                    <Typography variant="caption" color="primary.main">
                        {attachment.author.name}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                        {dayjs(attachment.created_at).format(
                            "DD MMM YYYY HH:mm",
                        )}
                    </Typography>
                </Stack>
            </Stack>

            <Box flex={1} />

            <Stack direction="row" alignItems="center" gap={0.5}>
                <IconButton size="small">
                    <DownloadIcon
                        onClick={() => onDownload(attachment)}
                        fontSize="small"
                    />
                </IconButton>

                {canDelete && (
                    <IconButton size="small">
                        <DeleteIcon
                            onClick={onDelete}
                            color="error"
                            fontSize="small"
                        />
                    </IconButton>
                )}
            </Stack>
        </Stack>
    );
};
