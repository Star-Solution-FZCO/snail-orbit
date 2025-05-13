import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { t } from "i18next";
import type { FC } from "react";
import type { IssueT } from "shared/model/types";
import { HeadingControls } from "./heading_controls";
import { IssueSubscribeButton } from "./issue_subscribe_button";

type IssueHeadingProps = {
    issue: IssueT;
    onEditClick?: () => unknown;
    hideSubscribeButton?: boolean;
    isEncrypted?: boolean;
};

export const IssueHeading: FC<IssueHeadingProps> = (props) => {
    const { issue, onEditClick, hideSubscribeButton, isEncrypted } = props;

    return (
        <Stack
            flexDirection="row"
            gap={1}
            position="relative"
            justifyContent="space-between"
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
                alignItems="center"
                gap={1}
                sx={{
                    wordBreak: "break-word",
                    color: issue.is_resolved ? "text.disabled" : "inherit",
                }}
            >
                <Typography fontSize={24} fontWeight="bold" flex={1}>
                    {issue.subject}
                </Typography>
                {isEncrypted ? <LockIcon fontSize="small" /> : null}
            </Stack>

            <Stack flexDirection="row" alignItems="flex-start" gap={1}>
                <Tooltip title={t("issues.heading.edit")} onClick={onEditClick}>
                    <IconButton size="small">
                        <EditIcon />
                    </IconButton>
                </Tooltip>

                <HeadingControls issue={issue} />
            </Stack>
        </Stack>
    );
};
