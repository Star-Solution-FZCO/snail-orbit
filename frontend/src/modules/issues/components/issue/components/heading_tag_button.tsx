import { LocalOffer } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { TagManagerPopover } from "entities/tag/tag_manager_popover";
import type { MouseEventHandler } from "react";
import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { issueApi } from "shared/model";
import type { IssueT } from "shared/model/types";
import type { TagT } from "shared/model/types/tag";

type HeadingTagButtonProps = {
    issue: IssueT;
};

export const HeadingTagButton = memo((props: HeadingTagButtonProps) => {
    const { issue } = props;
    const { t } = useTranslation();

    const [tagIssue] = issueApi.useTagIssueMutation();

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const handleButtonClick: MouseEventHandler<HTMLButtonElement> = useCallback(
        (e) => {
            e.preventDefault();
            setAnchorEl(e.currentTarget);
        },
        [],
    );

    const handleTagSelect = useCallback(
        (tag: TagT) => {
            tagIssue({ issueId: issue.id_readable, tag });
            setAnchorEl(null);
        },
        [issue.id_readable, tagIssue],
    );

    const handleClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    return (
        <>
            <Tooltip title={t("issues.tag.add.title")}>
                <IconButton onClick={handleButtonClick} size="small">
                    <LocalOffer />
                </IconButton>
            </Tooltip>

            <TagManagerPopover
                open={!!anchorEl}
                anchorEl={anchorEl}
                onClose={handleClose}
                onSelect={handleTagSelect}
            />
        </>
    );
});

HeadingTagButton.displayName = "HeadingTagButton";
