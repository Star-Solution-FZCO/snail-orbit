import EditIcon from "@mui/icons-material/Edit";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Link } from "components";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { t } from "i18next";
import type { FC } from "react";
import { slugify } from "transliteration";
import type { IssueT } from "types";
import { HeadingControls } from "./heading_controls";
import { IssueTags } from "./issue_tags";

dayjs.extend(relativeTime);
dayjs.extend(utc);

interface IIssueHeadingProps {
    issue: IssueT;
    displayMode: "view" | "edit";
    onChangeDisplayMode?: (mode: "view" | "edit") => void;
}

const IssueHeading: FC<IIssueHeadingProps> = ({
    issue,
    displayMode,
    onChangeDisplayMode,
}) => {
    const handleClickEdit = () => {
        onChangeDisplayMode?.("edit");
    };

    const renderTimestamp = (date: string) => (
        <Tooltip
            title={dayjs.utc(date).local().format("DD MMM YYYY HH:mm")}
            placement="bottom"
        >
            <Typography component="span" fontSize="inherit">
                {dayjs.utc(date).local().fromNow()}
            </Typography>
        </Tooltip>
    );

    return (
        <Box display="flex" flexDirection="column" gap={2}>
            <Box
                display="flex"
                alignItems="center"
                fontSize={14}
                flexWrap="wrap"
            >
                <Link
                    mr={1}
                    to="/issues/$issueId/$subject"
                    params={{
                        issueId: issue.id,
                        subject: slugify(issue.subject),
                    }}
                    sx={(theme) => ({
                        color: issue.is_resolved
                            ? theme.palette.text.disabled
                            : theme.palette.primary.main,
                        textDecoration: issue.is_resolved
                            ? "line-through"
                            : "none",
                        "&:hover": {
                            color: theme.palette.primary.main,
                            textDecoration: issue.is_resolved
                                ? "line-through underline"
                                : "underline",
                        },
                    })}
                >
                    {issue.id_readable}
                </Link>

                <Typography color="text.secondary" fontSize="inherit" mr={1}>
                    {t("createdBy")}{" "}
                    <Typography
                        component="span"
                        color="primary"
                        fontSize="inherit"
                    >
                        {issue.created_by.name}
                    </Typography>{" "}
                    {renderTimestamp(issue.created_at)}
                </Typography>

                {issue.updated_by && issue.updated_at && (
                    <Typography
                        color="text.secondary"
                        fontSize="inherit"
                        mr={1}
                    >
                        {t("updatedBy")}{" "}
                        <Typography
                            component="span"
                            color="primary"
                            fontSize="inherit"
                        >
                            {issue.updated_by.name}
                        </Typography>{" "}
                        {renderTimestamp(issue.updated_at)}
                    </Typography>
                )}

                {issue.resolved_at && (
                    <Typography color="text.secondary" fontSize="inherit">
                        {t("resolved")} {renderTimestamp(issue.resolved_at)}
                    </Typography>
                )}
            </Box>

            {displayMode === "view" && (
                <Stack>
                    <Stack flexDirection="row" gap={1}>
                        <Typography
                            sx={{
                                wordBreak: "break-word",
                                color: issue.is_resolved
                                    ? "text.disabled"
                                    : "inherit",
                            }}
                            fontSize={24}
                            fontWeight="bold"
                            flex={1}
                        >
                            {issue.subject}
                        </Typography>

                        <Stack
                            flexDirection="row"
                            alignItems="flex-start"
                            gap={1}
                        >
                            <Tooltip
                                title={t("issues.heading.edit")}
                                onClick={handleClickEdit}
                            >
                                <IconButton size="small">
                                    <EditIcon />
                                </IconButton>
                            </Tooltip>

                            <HeadingControls issue={issue} />
                        </Stack>
                    </Stack>
                    <IssueTags issue={issue} />
                </Stack>
            )}
        </Box>
    );
};

export { IssueHeading };
