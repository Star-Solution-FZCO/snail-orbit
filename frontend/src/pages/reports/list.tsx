import AddIcon from "@mui/icons-material/Add";
import {
    Box,
    Button,
    CircularProgress,
    Container,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { useCreateIssueNavbarSettings } from "modules/issues/hooks/use-create-issue-navbar-settings";
import { ReportListItem } from "modules/reports/components/report_list_item";
import { useTranslation } from "react-i18next";
import { reportApi } from "shared/model/api/report.api";
import { Link, QueryPagination } from "shared/ui";
import { formatErrorMessages, useListQueryParams } from "shared/utils";
import useDebouncedState from "shared/utils/hooks/use-debounced-state";

const perPageOptions = [10, 25, 50, 100, 500, 1000];

export const ReportsList = () => {
    const { t } = useTranslation();

    useCreateIssueNavbarSettings();

    const [debouncedSearch, setSearch, search] = useDebouncedState<string>("");
    const [listQueryParams, updateListQueryParams] = useListQueryParams();

    const { data, isLoading, error } = reportApi.useListReportsQuery({
        ...listQueryParams,
        search: debouncedSearch,
    });

    const reports = data?.payload?.items || [];
    const count = data?.payload?.count || 0;

    return (
        <Container
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                height: "100%",
                px: 4,
                pb: 4,
            }}
            disableGutters
        >
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
            >
                <TextField
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    fullWidth
                    size="small"
                    placeholder={t("reports.list.search.placeholder")}
                />

                <Link to="/reports/create">
                    <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        sx={{ textWrap: "nowrap", height: "40px" }}
                    >
                        {t("reports.create.title")}
                    </Button>
                </Link>
            </Stack>

            {error && (
                <Typography>
                    {formatErrorMessages(error) ||
                        t("reports.list.fetch.error")}
                </Typography>
            )}

            {isLoading && (
                <Box display="flex" justifyContent="center">
                    <CircularProgress size={48} color="primary" />
                </Box>
            )}

            {!isLoading && (
                <>
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                    >
                        <Typography color="textDisabled" variant="subtitle2">
                            {t("reports.count", { count })}
                        </Typography>

                        {count ? (
                            <Stack direction="row" alignItems="center" gap={1}>
                                <Typography variant="subtitle2">
                                    {t("pagination.showRows")}:
                                </Typography>

                                <Select
                                    sx={{
                                        ".MuiSelect-select": {
                                            py: 0.5,
                                            pl: 1,
                                            pr: 2,
                                        },
                                    }}
                                    value={listQueryParams.limit}
                                    renderValue={() => listQueryParams.limit}
                                    onChange={(e) =>
                                        updateListQueryParams({
                                            limit: +e.target.value,
                                            offset: 0,
                                        })
                                    }
                                    variant="outlined"
                                    size="small"
                                >
                                    {perPageOptions.map((value) => (
                                        <MenuItem key={value} value={value}>
                                            {value}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Stack>
                        ) : null}
                    </Stack>

                    <Box
                        display="flex"
                        flexDirection="column"
                        gap={2}
                        flex={1}
                        overflow="auto"
                    >
                        {reports.map((report) => (
                            <ReportListItem report={report} />
                        ))}
                    </Box>

                    <QueryPagination
                        count={count}
                        queryParams={listQueryParams}
                        updateQueryParams={updateListQueryParams}
                    />
                </>
            )}
        </Container>
    );
};
