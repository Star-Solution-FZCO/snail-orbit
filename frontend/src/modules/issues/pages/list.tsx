import AddIcon from "@mui/icons-material/Add";
import { Box, CircularProgress, Divider, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { issueApi } from "shared/model";
import { Link } from "shared/ui";
import { NavbarActionButton } from "shared/ui/navbar/navbar_action_button";
import { useNavbarSettings } from "shared/ui/navbar/navbar_settings";
import { formatErrorMessages, usePaginationParams } from "shared/utils";
import useDebouncedState from "shared/utils/hooks/use-debounced-state";
import type { IssueT } from "../../../shared/model/types";
import { SearchField } from "../components/issue/components/search_field";
import IssuesList from "../components/list/issues_list";
import { QueryBuilder } from "../components/query_builder/query_builder";
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
    const { setAction } = useNavbarSettings();
    const { openIssueModal } = useIssueModalView();

    const [showQueryBuilder, setShowQueryBuilder] = useState<boolean>(false);

    const [debouncedSearch, setSearch, searchQuery] = useDebouncedState<string>(
        queryParams?.query || "",
    );

    const [listQueryParams, updateListQueryParams] = usePaginationParams({
        perPage: queryParams?.perPage ?? 10,
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

    useEffect(() => {
        setAction(
            <Link to="/issues/create">
                <NavbarActionButton startIcon={<AddIcon />}>
                    {t("issues.new")}
                </NavbarActionButton>
            </Link>,
        );

        return () => setAction(null);
    }, [setAction, t]);

    const handleIssueRowDoubleClick = useCallback(
        (issue: IssueT) => {
            openIssueModal(issue.id_readable);
        },
        [openIssueModal],
    );

    const rows = data?.payload.items || [];

    return (
        <>
            <Box
                component={PanelGroup}
                px={4}
                direction="horizontal"
                autoSaveId="issueListPage"
                id="issueListPage"
            >
                <Box
                    display="flex"
                    flexDirection="column"
                    gap={2}
                    height="100%"
                    component={Panel}
                    order={5}
                    id="mainContent"
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
                            onChangePage={(page) =>
                                updateListQueryParams({ page })
                            }
                            totalCount={data?.payload.count}
                            perPage={listQueryParams.perPage}
                            onChangePerPage={(perPage) =>
                                updateListQueryParams({ perPage, page: 1 })
                            }
                            onIssueRowDoubleClick={handleIssueRowDoubleClick}
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
        </>
    );
};

export { IssueList };
