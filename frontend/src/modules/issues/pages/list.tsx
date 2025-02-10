import AddIcon from "@mui/icons-material/Add";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import {
    Box,
    CircularProgress,
    Divider,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { issueApi } from "store";
import { formatErrorMessages, useListQueryParams } from "utils";
import useDebouncedState from "utils/hooks/use-debounced-state";
import {
    Link,
    NavbarActionButton,
    useNavbarSettings,
} from "../../../components";
import { IssueRowViewParams } from "../components/list/issue_row/issue_row.types";
import IssuesList from "../components/list/issues_list";
import { QueryBuilder } from "../components/QueryBuilder/QueryBuilder";

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

    const [debouncedSearch, setSearch, searchQuery] =
        useDebouncedState<string>("");

    const [listQueryParams, updateListQueryParams] = useListQueryParams({
        limit: perPage,
        offset: search?.page ? (search.page - 1) * perPage : 0,
        q: debouncedSearch,
    });

    const { data, isFetching, error, isLoading } =
        issueApi.useListIssuesQuery(listQueryParams);

    useEffect(() => {
        updateListQueryParams({ q: debouncedSearch });
    }, [debouncedSearch]);

    useEffect(() => {
        updateListQueryParams({
            offset: search?.page ? (search.page - 1) * perPage : 0,
        });
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
                id="mainContent"
                minSize={65}
            >
                <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                        fullWidth
                        size="small"
                        placeholder={t("placeholder.search")}
                        value={searchQuery}
                        onChange={(e) => setSearch(e.target.value)}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        {isFetching && (
                                            <CircularProgress
                                                size={14}
                                                color="inherit"
                                            />
                                        )}
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />

                    <IconButton
                        onClick={() => setShowQueryBuilder((prev) => !prev)}
                        color={showQueryBuilder ? "primary" : "default"}
                    >
                        <FilterAltIcon />
                    </IconButton>
                </Stack>

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
                                            {issueListSettingOptions[key].label}
                                        </ToggleButton>
                                    ),
                                )}
                            </ToggleButtonGroup>
                        </Stack>

                        <IssuesList
                            issues={rows}
                            page={
                                listQueryParams.offset / listQueryParams.limit +
                                1
                            }
                            pageCount={Math.ceil(
                                (data?.payload.count || 0) /
                                    listQueryParams.limit,
                            )}
                            onChangePage={(page) => {
                                updateListQueryParams({
                                    offset: (page - 1) * perPage,
                                });
                                navigate({
                                    search: {
                                        page: page > 1 ? page : undefined,
                                    },
                                });
                            }}
                            viewSettings={
                                issueListSettingOptions[selectedIssueViewOption]
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
                    >
                        <Divider orientation="vertical" />
                    </Box>

                    <Box
                        id="queryBuilder"
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
