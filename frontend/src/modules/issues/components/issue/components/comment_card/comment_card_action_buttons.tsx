import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LinkIcon from "@mui/icons-material/Link";
import { Box, type SxProps, type Theme } from "@mui/material";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import type { CommentT } from "shared/model/types";

const iconStyles = (hoverColor: string): SxProps<Theme> => ({
    "&:hover": {
        cursor: "pointer",
        fill: hoverColor,
    },
});

type ActionButtonsProps = {
    comment: CommentT;
    isModifyActionsAvailable: boolean;
    onEdit: (comment: CommentT) => void;
    onDelete: (comment: CommentT) => void;
};

export const CommentCardActionButtons: FC<ActionButtonsProps> = ({
    comment,
    isModifyActionsAvailable,
    onEdit,
    onDelete,
}) => {
    const { t } = useTranslation();

    const handleClickCopyLink = () => {
        const commentUrl = `${window.location.href}#comment-${comment.id}`;

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
            {isModifyActionsAvailable && (
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

            {isModifyActionsAvailable && (
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
