import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LinkIcon from "@mui/icons-material/Link";
import { Box, type SxProps, type Theme } from "@mui/material";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import type { CommentT } from "shared/model/types";
import {
    ISSUE_LINK_MODE_DEFAULT_VALUE,
    ISSUE_LINK_MODE_KEY,
    IssueLinkMode,
} from "shared/model/types/settings";
import { useLSState } from "shared/utils/helpers/local-storage";
import { slugify } from "transliteration";

const iconStyles = (hoverColor: string): SxProps<Theme> => ({
    "&:hover": {
        cursor: "pointer",
        fill: hoverColor,
    },
});

type ActionButtonsProps = {
    issueId: string;
    issueSubject: string;
    comment: CommentT;
    onEdit: (comment: CommentT) => void;
    onDelete: (comment: CommentT) => void;
    isModifyActionsAvailable: boolean;
};

export const CommentCardActionButtons: FC<ActionButtonsProps> = ({
    issueId,
    issueSubject,
    comment,
    onEdit,
    onDelete,
    isModifyActionsAvailable,
}) => {
    const { t } = useTranslation();

    const [issueLinkMode] = useLSState<IssueLinkMode>(
        ISSUE_LINK_MODE_KEY,
        ISSUE_LINK_MODE_DEFAULT_VALUE,
    );

    const handleClickCopyLink = () => {
        const path =
            issueLinkMode === "long"
                ? `/issues/${issueId}/${slugify(issueSubject)}#comment-${comment.id}`
                : `/issues/${issueId}#comment-${comment.id}`;
        const commentUrl = window.location.origin + path;

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
