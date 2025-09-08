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
import { CreateDashboardDialog } from "modules/dashboards/components/create_dashboard_dialog";
import { DashboardListItem } from "modules/dashboards/components/dashboard_list_item";
import { useCreateIssueNavbarSettings } from "modules/issues/hooks/use-create-issue-navbar-settings";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { dashboardApi } from "shared/model";
import { QueryPagination } from "shared/ui";
import { formatErrorMessages, useListQueryParams } from "shared/utils";
import useDebouncedState from "shared/utils/hooks/use-debounced-state";

const perPageOptions = [10, 25, 50, 100, 500, 1000];

export const DashboardList = () => {
    const { t } = useTranslation();

    useCreateIssueNavbarSettings();

    const [debouncedSearch, setSearch, search] = useDebouncedState<string>("");
    const [listQueryParams, updateListQueryParams] = useListQueryParams();

    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const { data, isLoading, error } = dashboardApi.useListDashboardQuery({
        ...listQueryParams,
        search: debouncedSearch,
    });

    const dashboards = data?.payload?.items || [];
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
            <Stack direction="row" justifyContent="space-between" gap={1}>
                <TextField
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t("dashboards.list.search.placeholder")}
                    size="small"
                    fullWidth
                />

                <Button
                    sx={{ textWrap: "nowrap", flexShrink: 0 }}
                    onClick={() => setCreateDialogOpen(true)}
                    startIcon={<AddIcon />}
                    variant="outlined"
                    size="small"
                >
                    {t("dashboards.new")}
                </Button>
            </Stack>

            <CreateDashboardDialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
            />

            {error && (
                <Typography>
                    {formatErrorMessages(error) ||
                        t("dashboards.list.fetch.error")}
                </Typography>
            )}

            {isLoading ? (
                <Box display="flex" justifyContent="center">
                    <CircularProgress size={48} color="inherit" />
                </Box>
            ) : (
                <>
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                    >
                        <Typography color="textDisabled" variant="subtitle2">
                            {t("dashboards.count", { count })}
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
                        {dashboards.map((dashboard) => (
                            <DashboardListItem
                                key={dashboard.id}
                                dashboard={dashboard}
                            />
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
