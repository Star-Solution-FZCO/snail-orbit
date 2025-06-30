import CommentIcon from "@mui/icons-material/Comment";
import HistoryIcon from "@mui/icons-material/History";
import { Box, MenuItem, Select, Tooltip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { formatSpentTime } from "shared/utils";
import { ActivityTypeButton } from "./activity_type_button";
import type { IssuesActivitiesSettings } from "./issue_activities.types";

type Props = {
    value: IssuesActivitiesSettings;
    onChange?: (value: IssuesActivitiesSettings) => void;
    totalSpentTime: number;
};

export const IssueActivitiesSettings = (props: Props) => {
    const { t } = useTranslation();
    const { value, onChange, totalSpentTime } = props;

    return (
        <Box
            display="flex"
            alignItems="center"
            borderTop={1}
            borderColor="divider"
        >
            <Tooltip title={t("issues.comments.title")} placement="top">
                <ActivityTypeButton
                    onClick={() =>
                        onChange?.({
                            ...value,
                            displayComments: !value.displayComments,
                        })
                    }
                    enabled={value.displayComments}
                    variant="outlined"
                    size="small"
                >
                    <CommentIcon />
                </ActivityTypeButton>
            </Tooltip>

            <Tooltip title={t("issues.history.title")} placement="top">
                <ActivityTypeButton
                    onClick={() =>
                        onChange?.({
                            ...value,
                            displayingActivities: !value.displayingActivities,
                        })
                    }
                    enabled={value.displayingActivities}
                    variant="outlined"
                    size="small"
                >
                    <HistoryIcon />
                </ActivityTypeButton>
            </Tooltip>

            <Box flex={1} />

            <Box display="flex" alignItems="center" gap={1}>
                {totalSpentTime > 0 && (
                    <Typography fontSize={14} fontWeight="bold">
                        {t("issues.spentTime.total")}:{" "}
                        {formatSpentTime(totalSpentTime)}
                    </Typography>
                )}

                <Select
                    sx={(theme) => ({
                        "& .MuiSelect-select": {
                            p: theme.spacing(0.5),
                            fontSize: 14,
                            fontWeight: "bold",
                        },
                    })}
                    value={value.sortOrder}
                    onChange={(event) =>
                        onChange?.({
                            ...value,
                            sortOrder: event.target
                                .value as IssuesActivitiesSettings["sortOrder"],
                        })
                    }
                    variant="standard"
                    size="small"
                >
                    <MenuItem value="oldestFirst">
                        {t("issues.activities.oldestFirst")}
                    </MenuItem>
                    <MenuItem value="newestFirst">
                        {t("issues.activities.newestFirst")}
                    </MenuItem>
                </Select>
            </Box>
        </Box>
    );
};
