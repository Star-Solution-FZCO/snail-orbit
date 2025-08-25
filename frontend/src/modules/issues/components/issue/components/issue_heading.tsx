import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { t } from "i18next";
import type { FC } from "react";
import type { IssueT } from "shared/model/types";
import { HeadingControls } from "./heading_controls/heading_controls";
import { IssueSubscribeButton } from "./issue_subscribe_button";

type IssueHeadingProps = {
    issue: IssueT;
    onEditClick?: () => unknown;
    onAddLinkClick?: () => unknown;
    hideSubscribeButton?: boolean;
    isEncrypted?: boolean;
};

export const IssueHeading: FC<IssueHeadingProps> = (props) => {
    const {
        issue,
        onEditClick,
        onAddLinkClick,
        isEncrypted,
        hideSubscribeButton,
    } = props;

    return (
        <Stack
            flexDirection="row"
            justifyContent="space-between"
            position="relative"
            gap={1}
        >
            {!hideSubscribeButton && (
                <Box
                    position="absolute"
                    top={0}
                    left={-28}
                    height="36px"
                    display="flex"
                    alignItems="center"
                >
                    <IssueSubscribeButton issue={issue} />
                </Box>
            )}

            <Stack
                direction="row"
                gap={1}
                sx={{
                    color: issue.is_resolved ? "text.disabled" : "inherit",
                }}
            >
                <Typography
                    sx={{
                        flex: 1,
                        fontSize: "24px",
                        fontWeight: "bold",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 3,
                        wordBreak: "break-word",
                    }}
                    title={issue.subject}
                >
                    {issue.subject}
                </Typography>

                {isEncrypted ? (
                    <LockIcon sx={{ mt: "5px", mr: "5px" }} color="info" />
                ) : null}
            </Stack>

            <Stack flexDirection="row" alignItems="flex-start" gap={1}>
                <Tooltip title={t("issues.heading.edit")} onClick={onEditClick}>
                    <IconButton size="small">
                        <EditIcon />
                    </IconButton>
                </Tooltip>

                <HeadingControls
                    issue={issue}
                    onAddLinkClick={onAddLinkClick}
                />
            </Stack>
        </Stack>
    );
};
