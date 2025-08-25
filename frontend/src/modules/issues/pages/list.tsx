import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import type { FC } from "react";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { issueApi } from "shared/model";
import type { IssueT, ProjectT } from "shared/model/types";
import { defaultLimit, formatErrorMessages, useParams } from "shared/utils";
import { IssueSearchSelect } from "../components/issue/components/issue_project_select";
import { SearchField } from "../components/issue/components/search_field";
import IssuesList from "../components/list/issues_list";
import { useCreateIssueNavbarSettings } from "../hooks/use-create-issue-navbar-settings";
import { useIssueModalView } from "../widgets/modal_view/use_modal_view";

export type IssueListQueryParams = {
    page?: number;
    perPage?: number;
    query?: string;
};

export type IssueListProps = {
    queryParams?: IssueListQueryParams;
    onQueryParamsChanged?: (params: Partial<IssueListQueryParams>) => unknown;
    listId?: string;
    onChangeListId?: (id: string) => unknown;
};

const IssueList: FC<IssueListProps> = (props) => {
    const { queryParams, onQueryParamsChanged, listId, onChangeListId } = props;

    const { t } = useTranslation();
    const { openIssueModal } = useIssueModalView();

    useCreateIssueNavbarSettings();

    const [listQueryParams, updateListQueryParams] = useParams({
        perPage: queryParams?.perPage ?? defaultLimit,
        page: queryParams?.page ?? 1,
        query: queryParams?.query || "",
    });

    const totalQuery = useMemo(() => {
        const parts = [
            listId ? `project: ${listId}` : "",
            listQueryParams.query,
        ];
        return parts.filter((el) => !!el).join(" and ");
    }, [listId, listQueryParams.query]);

    const { data, isFetching, error, isLoading } = issueApi.useListIssuesQuery({
        limit: listQueryParams.perPage,
        offset: (listQueryParams.page - 1) * listQueryParams.perPage,
        q: totalQuery,
    });

    const handleSearchUpdate = useCallback(
        (search: string) => {
            updateListQueryParams((prev) => ({
                ...prev,
                query: search,
            }));
        },
        [updateListQueryParams],
    );

    useEffect(() => {
        onQueryParamsChanged?.(listQueryParams);
    }, [listQueryParams, onQueryParamsChanged, queryParams]);

    // useEffect(() => {
    //     updateListQueryParams((prev) => ({
    //         ...prev,
    //         ...queryParams,
    //     }));
    // }, [queryParams, updateListQueryParams]);

    const handleIssueRowDoubleClick = useCallback(
        (issue: IssueT) => {
            openIssueModal(issue.id_readable);
        },
        [openIssueModal],
    );

    const handleIssueSearchSelectChange = useCallback(
        (project: ProjectT | null) => {
            if (project) onChangeListId?.(project.slug);
            else onChangeListId?.("");
        },
        [onChangeListId],
    );

    const rows = data?.payload.items || [];

    return (
        <Box
            id="mainContent"
            display="flex"
            flexDirection="column"
            gap={2}
            height={1}
            px={4}
        >
            <Stack direction="row" gap={1}>
                <IssueSearchSelect
                    selectedProjectSlug={listId}
                    onChange={handleIssueSearchSelectChange}
                />

                <SearchField
                    value={listQueryParams?.query || ""}
                    onChange={handleSearchUpdate}
                    loading={isFetching}
                />
            </Stack>

            {error && (
                <Typography color="error" fontSize={16}>
                    {formatErrorMessages(error) || t("issues.list.fetch.error")}
                    !
                </Typography>
            )}

            {isLoading ? (
                <CircularProgress />
            ) : (
                <IssuesList
                    issues={rows}
                    page={listQueryParams.page}
                    pageCount={Math.ceil(
                        (data?.payload.count || 0) / listQueryParams.perPage,
                    )}
                    onChangePage={(page) => updateListQueryParams({ page })}
                    onChangePerPage={(perPage) =>
                        updateListQueryParams({ perPage, page: 1 })
                    }
                    onIssueRowDoubleClick={handleIssueRowDoubleClick}
                    totalCount={data?.payload.count}
                    perPage={listQueryParams.perPage}
                />
            )}
        </Box>
    );
};

export { IssueList };
