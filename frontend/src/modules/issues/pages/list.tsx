import AddIcon from "@mui/icons-material/Add";
import {
    Box,
    CircularProgress,
    Divider,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { Link } from "components";
import { NavbarActionButton } from "components/navbar/navbar_action_button";
import { useNavbarSettings } from "components/navbar/navbar_settings";
import { FC, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { issueApi } from "store";
import { formatErrorMessages, useListQueryParams } from "utils";
import useDebouncedState from "utils/hooks/use-debounced-state";
import { SearchField } from "../components/issue/search_field";
import { IssueRowViewParams } from "../components/list/issue_row/issue_row.types";
import IssuesList from "../components/list/issues_list";
import { QueryBuilder } from "../components/query_builder/query_builder";

const perPage = 10;

const issueListSettingOptions: Record<
    string,
    IssueRowViewParams & { label: string }
> = {
    small: {
        label: "S",
        showDescription: false,
        showCustomFields: false,
        showDividers: false,
    },
    medium: {
        label: "M",
        showDescription: false,
        showCustomFields: true,
        showDividers: true,
    },
    large: {
        label: "L",
        showDescription: true,
        showCustomFields: true,
        showDividers: true,
    },
};

const routeApi = getRouteApi("/_authenticated/issues/");

const IssueList: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const search = routeApi.useSearch();
    const { setAction } = useNavbarSettings();

    const [showQueryBuilder, setShowQueryBuilder] = useState<boolean>(false);
    const [selectedIssueViewOption, setSelectedIssueViewOption] =
        useState<string>("medium");

    const [debouncedSearch, setSearch, searchQuery] = useDebouncedState<string>(
        search?.query || "",
    );

    const [listQueryParams, updateListQueryParams] = useListQueryParams({
        limit: perPage,
        offset: search?.page ? (search.page - 1) * perPage : 0,
        q: debouncedSearch,
    });

    const { data, isFetching, error, isLoading } =
        issueApi.useListIssuesQuery(listQueryParams);

    useEffect(() => {
        updateListQueryParams({ q: debouncedSearch });
        navigate({
            search: (prev: { page?: number; query?: string }) => ({
                ...prev,
                query: debouncedSearch || undefined,
            }),
        });
    }, [debouncedSearch]);

    useEffect(() => {
        updateListQueryParams({
            offset: search?.page ? (search.page - 1) * perPage : 0,
        });
        setSearch(search?.query || "");
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

    const handleChangePage = useCallback((page: number) => {
        updateListQueryParams({
            offset: (page - 1) * perPage,
        });
        navigate({
            search: (prev: { page?: number; query?: string }) => ({
                ...prev,
                page: page > 1 ? page : undefined,
            }),
        });
    }, []);

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
                                    {t("issueListPage.issueCount", {
                                        count: data?.payload.count || 0,
                                    })}
                                </Typography>

                                <ToggleButtonGroup
                                    size="small"
                                    exclusive
                                    value={selectedIssueViewOption}
                                    onChange={(_, value) =>
                                        setSelectedIssueViewOption(value)
                                    }
                                >
                                    {Object.keys(issueListSettingOptions).map(
                                        (key) => (
                                            <ToggleButton
                                                key={key}
                                                value={key}
                                                sx={{ px: 0.8, py: 0.2 }}
                                            >
                                                {
                                                    issueListSettingOptions[key]
                                                        .label
                                                }
                                            </ToggleButton>
                                        ),
                                    )}
                                </ToggleButtonGroup>
                            </Stack>

                            <IssuesList
                                issues={rows}
                                page={
                                    listQueryParams.offset /
                                        listQueryParams.limit +
                                    1
                                }
                                pageCount={Math.ceil(
                                    (data?.payload.count || 0) /
                                        listQueryParams.limit,
                                )}
                                onChangePage={handleChangePage}
                                viewSettings={
                                    issueListSettingOptions[
                                        selectedIssueViewOption
                                    ]
                                }
                            />
                        </Stack>
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
