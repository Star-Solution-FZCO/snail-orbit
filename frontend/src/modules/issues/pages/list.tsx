import AddIcon from "@mui/icons-material/Add";
import { Box, CircularProgress, Divider, Typography } from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { Link } from "components";
import { NavbarActionButton } from "components/navbar/navbar_action_button";
import { useNavbarSettings } from "components/navbar/navbar_settings";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { issueApi } from "store";
import { formatErrorMessages, usePaginationParams } from "utils";
import useDebouncedState from "utils/hooks/use-debounced-state";
import { SearchField } from "../components/issue/search_field";
import IssuesList from "../components/list/issues_list";
import { QueryBuilder } from "../components/query_builder/query_builder";

const routeApi = getRouteApi("/_authenticated/issues/");

const IssueList: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const search = routeApi.useSearch();
    const { setAction } = useNavbarSettings();

    const [showQueryBuilder, setShowQueryBuilder] = useState<boolean>(false);

    const [debouncedSearch, setSearch, searchQuery] = useDebouncedState<string>(
        search?.query || "",
    );

    const [listQueryParams, updateListQueryParams, resetListQueryParams] =
        usePaginationParams({
            perPage: search?.perPage ?? 10,
            page: search?.page ?? 1,
            q: debouncedSearch,
        });

    const { data, isFetching, error, isLoading } = issueApi.useListIssuesQuery({
        limit: listQueryParams.perPage,
        offset: (listQueryParams.page - 1) * listQueryParams.perPage,
        q: listQueryParams.q,
    });

    const [updateIssue] = issueApi.useUpdateIssueMutation();

    useEffect(() => {
        updateListQueryParams({ q: debouncedSearch });
    }, [debouncedSearch]);

    useEffect(() => {
        navigate({
            search: (prev: {
                page?: number;
                query?: string;
                perPage?: number;
            }) => ({
                ...prev,
                page: listQueryParams.page,
                perPage: listQueryParams.perPage,
                query: listQueryParams.q || undefined,
            }),
        });
    }, [listQueryParams]);

    useEffect(() => {
        resetListQueryParams();
    }, [search]);

    useEffect(() => {
        setAction(
            <Link to="/issues/create">
                <NavbarActionButton startIcon={<AddIcon />}>
                    {t("issues.new")}
                </NavbarActionButton>
            </Link>,
        );

        return () => setAction(null);
    }, [setAction]);

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
                            onUpdateIssue={updateIssue}
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
