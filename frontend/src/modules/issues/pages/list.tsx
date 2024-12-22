import { Search } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import {
    Box,
    Button,
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
import { Link } from "components";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { issueApi } from "store";
import { formatErrorMessages, useListQueryParams } from "utils";
import useDebouncedState from "utils/hooks/use-debounced-state";
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
    },
    medium: {
        label: "M",
        showDescription: false,
        showCustomFields: true,
    },
    large: {
        label: "L",
        showDescription: true,
        showCustomFields: true,
    },
};

const IssueList: FC = () => {
    const { t } = useTranslation();
    const [showQueryBuilder, setShowQueryBuilder] = useState<boolean>(false);

    const [selectedIssueViewOption, setSelectedIssueViewOption] =
        useState<string>("medium");
    const [debouncedSearch, setSearch, search] = useDebouncedState<string>("");

    const [listQueryParams, updateListQueryParams] = useListQueryParams({
        limit: perPage,
        q: debouncedSearch,
    });

    const { data, isFetching, error, isLoading } =
        issueApi.useListIssuesQuery(listQueryParams);

    useEffect(() => {
        updateListQueryParams({ q: debouncedSearch });
    }, [debouncedSearch]);

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
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    gap={1}
                >
                    <Box display="flex" alignItems="center" gap={2}>
                        <Typography fontSize={24} fontWeight="bold">
                            {t("issues.title")}
                        </Typography>

                        {error && (
                            <Typography color="error" fontSize={16}>
                                {formatErrorMessages(error) ||
                                    t("issues.list.fetch.error")}
                                !
                            </Typography>
                        )}
                    </Box>

                    <Link to="/issues/create">
                        <Button
                            startIcon={<AddIcon />}
                            variant="outlined"
                            size="small"
                        >
                            {t("issues.new")}
                        </Button>
                    </Link>
                </Stack>

                <TextField
                    fullWidth
                    size="small"
                    placeholder={t("placeholder.search")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    {isFetching ? (
                                        <CircularProgress size={14} />
                                    ) : (
                                        <IconButton
                                            onClick={() =>
                                                setShowQueryBuilder(
                                                    (prev) => !prev,
                                                )
                                            }
                                        >
                                            <Search />
                                        </IconButton>
                                    )}
                                </InputAdornment>
                            ),
                        },
                    }}
                />

                {isLoading ? (
                    <CircularProgress />
                ) : (
                    <Stack direction="column" gap={1}>
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
                            onChangePage={(page) =>
                                updateListQueryParams({
                                    offset: (page - 1) * perPage,
                                })
                            }
                            viewSettings={
                                issueListSettingOptions[selectedIssueViewOption]
                            }
                        />
                    </Stack>
                )}
            </Box>
            {showQueryBuilder ? (
                <>
                    <Box
                        component={PanelResizeHandle}
                        paddingLeft={2}
                        id="queryBuiderResizer"
                    >
                        <Divider orientation="vertical" />
                    </Box>
                    <Box
                        component={Panel}
                        defaultSize={20}
                        marginRight={-4}
                        minSize={15}
                        id="queryBuilder"
                    >
                        <QueryBuilder
                            onChangeQuery={setSearch}
                            initialQuery={search}
                        />
                    </Box>{" "}
                </>
            ) : null}
        </Box>
    );
};

export { IssueList };
