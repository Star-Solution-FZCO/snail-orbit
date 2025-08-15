import CloseIcon from "@mui/icons-material/Close";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { TagT } from "shared/model/types";
import { TagPermissionsList } from "./tag_permissions_list";

type TagPermissionsDialogProps = {
    tag: TagT;
    open: boolean;
    onClose: () => void;
};

export const TagPermissionsDialog: FC<TagPermissionsDialogProps> = ({
    tag,
    open,
    onClose,
}) => {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                }}
            >
                {t("tags.access.management.title", {
                    tagName: tag.name,
                })}

                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <TagPermissionsList tag={tag} />
            </DialogContent>
        </Dialog>
    );
};
