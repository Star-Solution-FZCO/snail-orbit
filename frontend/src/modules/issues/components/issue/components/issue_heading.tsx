import EditIcon from "@mui/icons-material/Edit";

import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { t } from "i18next";
import type { FC } from "react";
import type { IssueT } from "types";
import { HeadingControls } from "./heading_controls";
import { IssueSubscribeButton } from "./issue_subscribe_button";

type IssueHeadingProps = {
    issue: IssueT;
    onEditClick?: () => unknown;
};

export const IssueHeading: FC<IssueHeadingProps> = (props) => {
    const { issue, onEditClick } = props;

    return (
        <Stack flexDirection="row" gap={1} position="relative">
            <Box position="absolute" top={8} left={-28}>
                <IssueSubscribeButton issue={issue} />
            </Box>

            <Typography
                sx={{
                    wordBreak: "break-word",
                    color: issue.is_resolved ? "text.disabled" : "inherit",
                }}
                fontSize={24}
                fontWeight="bold"
                flex={1}
            >
                {issue.subject}
            </Typography>

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
