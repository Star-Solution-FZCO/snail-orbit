import ChangeCircleIcon from "@mui/icons-material/ChangeCircle";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import { Box, IconButton, Menu, MenuItem } from "@mui/material";
import { IssueLink } from "entities/issue/issue_link/issue_link";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { issueApi } from "shared/model";
import type { IssueLinkT, IssueLinkTypeT } from "shared/model/types";
import { linkTypes } from "shared/model/types";
import { toastApiError } from "shared/utils";

type IssueLinkCardProps = {
    issueId: string;
    link: IssueLinkT;
    onRemove: (linkId: string) => void;
};

export const IssueLinkCard: FC<IssueLinkCardProps> = ({
    issueId,
    link,
    onRemove,
}) => {
    const { t } = useTranslation();

    const { issue, id, type } = link;

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const [updateIssueLink] = issueApi.useUpdateIssueLinkMutation();

    const handleClickChangeLinkType = (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleClickLinkType = (linkType: IssueLinkTypeT) => {
        updateIssueLink({
            id: issueId,
            interlink_id: id,
            type: linkType,
        })
            .unwrap()
            .then(() => {
                handleCloseMenu();
                toast.success(t("issues.links.changeType.success"));
            })
            .catch(toastApiError);
    };

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 1,
                px: 0.5,
                py: 0.25,
                borderRadius: 1,
                "&:hover": {
                    backgroundColor: "action.hover",
                },
            }}
        >
            <Box
                display="flex"
                alignItems="center"
                gap={1}
                minHeight="32px"
                fontSize={14}
            >
                <IssueLink
                    issue={issue}
                    resolved={issue.is_resolved}
                    lineThrough={issue.is_resolved}
                    flexShrink={0}
                >
                    {issue.id_readable}
                </IssueLink>

                <IssueLink
                    sx={{
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 1,
                        textOverflow: "ellipsis",
                    }}
                    issue={issue}
                    title={issue.subject}
                    resolved={issue.is_resolved}
                >
                    {issue.subject}
                </IssueLink>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
                <IconButton
                    onClick={handleClickChangeLinkType}
                    size="small"
                    color="info"
                >
                    <ChangeCircleIcon />
                </IconButton>

                <Menu
                    anchorEl={anchorEl}
                    open={open}
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
                    {linkTypes
                        .filter((linkType) => linkType !== type)
                        .map((linkType) => (
                            <MenuItem
                                key={linkType}
                                value={linkType}
                                onClick={() => handleClickLinkType(linkType)}
                            >
                                {t(`issues.links.type.${linkType}`)}
                            </MenuItem>
                        ))}
                </Menu>

                <IconButton
                    onClick={() => onRemove(id)}
                    size="small"
                    color="error"
                >
                    <LinkOffIcon />
                </IconButton>
            </Box>
        </Box>
    );
};
