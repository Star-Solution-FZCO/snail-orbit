import {
    Divider,
    MenuItem,
    Pagination,
    Select,
    Stack,
    Typography,
} from "@mui/material";
import type { FC } from "react";
import React from "react";
import { useTranslation } from "react-i18next";
import { perPageOptions } from "shared/utils";
import { useLSState } from "shared/utils/helpers/local-storage";
import IssueRow from "./issue_row/issue_row";
import type { IssueRowViewParams } from "./issue_row/issue_row.types";
import { defaultIssueRowViewParams } from "./issue_row/issues_list.utils";
import type { IssuesListProps } from "./issues_list.types";
import { IssuesListSettings } from "./issues_list_settings";

export const IssuesList: FC<IssuesListProps> = ({
    issues,
    page,
    onChangePage,
    pageCount,
    totalCount,
    perPage,
    onChangePerPage,
    onIssueRowDoubleClick,
}) => {
    const { t } = useTranslation();

    const [issueViewParams, setIssueViewParams] =
        useLSState<IssueRowViewParams>(
            "ISSUE_LIST_PARAMS",
            defaultIssueRowViewParams,
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
                    <IssuesListSettings
                        rowViewParams={issueViewParams}
                        onRowViewParamsChange={setIssueViewParams}
                    />

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
                        <IssueRow
                            issue={issue}
                            onIssueRowDoubleClick={onIssueRowDoubleClick}
                            {...issueViewParams}
                        />
                        {issueViewParams?.showDividers &&
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
