import { Box, CircularProgress, Divider, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { issueApi } from "shared/model";
import type { IssueT } from "shared/model/types";
import {
    defaultLimit,
    formatErrorMessages,
    usePaginationParams,
} from "shared/utils";
import useDebouncedState from "shared/utils/hooks/use-debounced-state";
import { QueryBuilder } from "../../../widgets/query_builder/query_builder";
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
};

const IssueList: FC<IssueListProps> = (props) => {
    const { queryParams, onQueryParamsChanged } = props;

    const { t } = useTranslation();
    const navigate = useNavigate();
    const { openIssueModal } = useIssueModalView();

    useCreateIssueNavbarSettings();

    const [showQueryBuilder, setShowQueryBuilder] = useState<boolean>(false);

    const [debouncedSearch, setSearch, searchQuery] = useDebouncedState<string>(
        queryParams?.query || "",
    );

    const [listQueryParams, updateListQueryParams] = usePaginationParams({
        perPage: queryParams?.perPage ?? defaultLimit,
        page: queryParams?.page ?? 1,
        query: debouncedSearch,
    });

    const { data, isFetching, error, isLoading } = issueApi.useListIssuesQuery({
        limit: listQueryParams.perPage,
        offset: (listQueryParams.page - 1) * listQueryParams.perPage,
        q: listQueryParams.query,
    });

    useEffect(() => {
        updateListQueryParams({ query: debouncedSearch });
    }, [debouncedSearch, updateListQueryParams]);

    useEffect(() => {
        onQueryParamsChanged?.(listQueryParams);
    }, [listQueryParams, navigate, onQueryParamsChanged]);

    useEffect(() => {
        updateListQueryParams((prev) => ({
            ...prev,
            ...queryParams,
        }));
    }, [queryParams, setSearch, updateListQueryParams]);

    const handleIssueRowDoubleClick = useCallback(
        (issue: IssueT) => {
            openIssueModal(issue.id_readable);
        },
        [openIssueModal],
    );

    const rows = data?.payload.items || [];

    return (
        <Box
            id="issueListPage"
            autoSaveId="issueListPage"
            component={PanelGroup}
            direction="horizontal"
            maxWidth="100vw"
            px={4}
        >
            <Box
                id="mainContent"
                display="flex"
                flexDirection="column"
                gap={2}
                height={1}
                component={Panel}
                order={5}
                minSize={65}
            >
                <SearchField
                    value={searchQuery}
                    onChange={setSearch}
                    queryBuilderActive={showQueryBuilder}
                    onQueryBuilderClick={() =>
                        setShowQueryBuilder((prev) => !prev)
                    }
                    loading={isFetching}
                />

                {error && (
                    <Typography color="error" fontSize={16}>
                        {formatErrorMessages(error) ||
                            t("issues.list.fetch.error")}
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
                            (data?.payload.count || 0) /
                                listQueryParams.perPage,
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

            {showQueryBuilder && (
                <>
                    <Box
                        id="queryBuilderResizer"
                        component={PanelResizeHandle}
                        pl={2}
                        order={9}
                    >
                        <Divider orientation="vertical" />
                    </Box>

                    <Box
                        id="queryBuilder"
                        order={10}
                        component={Panel}
                        defaultSize={20}
                        mr={-4}
                        minSize={15}
                    >
                        <QueryBuilder
                            onChangeQuery={setSearch}
                            initialQuery={searchQuery}
                        />
                    </Box>
                </>
            )}
        </Box>
    );
};

export { IssueList };
