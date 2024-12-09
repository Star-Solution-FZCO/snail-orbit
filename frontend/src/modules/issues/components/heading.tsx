import EditIcon from "@mui/icons-material/Edit";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { Link } from "components";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { t } from "i18next";
import type { FC } from "react";
import type { IssueT } from "types";
import { HeadingControls } from "./heading_controls";

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
            <Box display="flex" alignItems="center" gap={2} fontSize={14}>
                <Link>{issue.id_readable}</Link>

                <Typography color="text.secondary" fontSize="inherit">
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
                    <Typography color="text.secondary" fontSize="inherit">
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
            </Box>

            {displayMode === "view" && (
                <Box display="flex" alignItems="flex-start" gap={1}>
                    <Typography fontSize={24} fontWeight="bold" flex={1}>
                        {issue.subject}
                    </Typography>

                    <Box
                        height="40px"
                        display="flex"
                        alignItems="center"
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
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export { IssueHeading };
