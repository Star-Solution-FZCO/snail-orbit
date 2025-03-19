import { LocalOffer } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import type { MouseEventHandler } from "react";
import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { issueApi, tagApi } from "store";
import { IssueT } from "types";
import { TagBaseT, TagT } from "types/tag";
import { TagFormDialog } from "../../../../tags/components/tag_form_dialog/tag_form_dialog";
import { TagListPopover } from "../../../../tags/components/tag_list/tag_list_popover";

type HeadingTagButtonProps = {
    issue: IssueT;
};

export const HeadingTagButton = memo((props: HeadingTagButtonProps) => {
    const { issue } = props;
    const { t } = useTranslation();

    const [createTag, { isLoading: isTagCreateLoading }] =
        tagApi.useCreateTagMutation();
    const [updateTag, { isLoading: isTagUpdateLoading }] =
        tagApi.useUpdateTagMutation();

    const [tagIssue] = issueApi.useTagIssueMutation();

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [isTagFormDialogOpen, setIsTagFormDialogOpen] =
        useState<boolean>(false);
    const [editTag, setEditTag] = useState<TagT | null>(null);

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

    const handleTagSelect = useCallback(
        (tag: TagT, type: "tag" | "untag" | "edit") => {
            if (type === "tag") tagIssue({ issueId: issue.id_readable, tag });
            if (type === "edit") {
                setEditTag(tag);
                setIsTagFormDialogOpen(true);
            }
        },
        [issue.id],
    );

    const handleTagFormSubmit = useCallback(
        (data: TagBaseT) => {
            if (!editTag)
                createTag(data)
                    .unwrap()
                    .then((resp) => {
                        toast.success(t("createTag.successMessage"));
                        handleTagSelect(resp.payload, "tag");
                        setIsTagFormDialogOpen(false);
                    });
            else
                updateTag({ ...data, id: editTag.id })
                    .unwrap()
                    .then(() => {
                        toast.success(t("updateTag.successMessage"));
                        setEditTag(null);
                        setIsTagFormDialogOpen(false);
                    });
        },
        [editTag],
    );

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
                onSelect={handleTagSelect}
            />

            <TagFormDialog
                open={isTagFormDialogOpen}
                onClose={() => setIsTagFormDialogOpen(false)}
                onSubmit={handleTagFormSubmit}
                isLoading={isTagCreateLoading || isTagUpdateLoading}
                defaultValues={editTag || undefined}
            />
        </>
    );
});

HeadingTagButton.displayName = "HeadingTagButton";
