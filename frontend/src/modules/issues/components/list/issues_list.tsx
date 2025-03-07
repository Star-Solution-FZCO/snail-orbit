import {
    Divider,
    MenuItem,
    Pagination,
    Select,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import type { FC } from "react";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import IssueRow from "./issue_row/issue_row";
import {
    issueListSettingOptions,
    perPageOptions,
} from "./issue_row/issues_list.utils";
import type { IssuesListProps } from "./issues_list.types";

export const IssuesList: FC<IssuesListProps> = ({
    issues,
    page,
    onChangePage,
    pageCount,
    totalCount,
    perPage,
    onChangePerPage,
}) => {
    const { t } = useTranslation();

    const [selectedIssueViewOption, setSelectedIssueViewOption] =
        useState<string>("medium");

    const viewSettings = useMemo(
        () => issueListSettingOptions[selectedIssueViewOption],
        [selectedIssueViewOption],
    );

    return (
        <Stack gap={1}>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
            >
                <Typography
                    fontSize={12}
                    color="textDisabled"
                    variant="subtitle2"
                >
                    {totalCount
                        ? t("issueList.totalCount", {
                              count: totalCount,
                          })
                        : null}
                </Typography>

                <Stack direction="row" gap={1}>
                    <ToggleButtonGroup
                        size="medium"
                        exclusive
                        value={selectedIssueViewOption}
                        onChange={(_, value) =>
                            setSelectedIssueViewOption(value)
                        }
                    >
                        {Object.keys(issueListSettingOptions).map((key) => (
                            <ToggleButton
                                key={key}
                                value={key}
                                sx={{ px: 0.8, py: 0.2 }}
                            >
                                {issueListSettingOptions[key].label}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>

                    <Select
                        variant="outlined"
                        size="small"
                        value={perPage}
                        renderValue={() => perPage}
                        sx={{
                            ".MuiSelect-select": { py: 0.5, pl: 1, pr: 2 },
                        }}
                        onChange={(e) => onChangePerPage?.(+e.target.value)}
                    >
                        {perPageOptions.map((value) => (
                            <MenuItem key={value} value={value}>
                                {value}
                            </MenuItem>
                        ))}
                    </Select>
                </Stack>
            </Stack>

            <Stack>
                {issues.map((issue, index) => (
                    <React.Fragment key={issue.id}>
                        <IssueRow issue={issue} {...viewSettings} />
                        {viewSettings?.showDividers &&
                            index !== issues.length - 1 && <Divider />}
                    </React.Fragment>
                ))}

                {pageCount > 1 ? (
                    <Pagination
                        size="small"
                        sx={{ mx: "auto", mt: 2 }}
                        count={pageCount}
                        page={page}
                        onChange={(_, newPage) => onChangePage?.(newPage)}
                    />
                ) : null}
            </Stack>
        </Stack>
    );
};

export default IssuesList;
