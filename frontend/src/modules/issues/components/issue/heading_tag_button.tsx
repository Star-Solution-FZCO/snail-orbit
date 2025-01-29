import { LocalOffer } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import type { MouseEventHandler } from "react";
import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { tagApi } from "store";
import { TagBaseT } from "types/tag";
import { TagFormDialog } from "../../../tags/components/tag_form_dialog/tag_form_dialog";
import { TagListPopover } from "../../../tags/components/tag_list/tag_list_popover";

export const HeadingTagButton = memo(() => {
    const { t } = useTranslation();

    const [createTag, { isLoading: isTagCreateLoading }] =
        tagApi.useCreateTagMutation();

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [isTagFormDialogOpen, setIsTagFormDialogOpen] =
        useState<boolean>(false);

    const handleAddNewButtonClick = useCallback(() => {
        setAnchorEl(null);
        setIsTagFormDialogOpen(true);
    }, []);

    const handleButtonClick: MouseEventHandler<HTMLButtonElement> = useCallback(
        (e) => {
            e.preventDefault();
            setAnchorEl(e.currentTarget);
        },
        [],
    );

    const handleTagFormSubmit = useCallback((data: TagBaseT) => {
        createTag(data)
            .unwrap()
            .then(() => {
                toast.success(t("createTag.successMessage"));
                setIsTagFormDialogOpen(false);
            });
    }, []);

    return (
        <>
            <Tooltip title={t("issues.tag.add.title")}>
                <IconButton onClick={handleButtonClick} size="small">
                    <LocalOffer />
                </IconButton>
            </Tooltip>

            <TagListPopover
                open={!!anchorEl}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                onAddNewClick={handleAddNewButtonClick}
            />

            <TagFormDialog
                open={isTagFormDialogOpen}
                onClose={() => setIsTagFormDialogOpen(false)}
                onSubmit={handleTagFormSubmit}
                isLoading={isTagCreateLoading}
            />
        </>
    );
});

HeadingTagButton.displayName = "HeadingTagButton";
