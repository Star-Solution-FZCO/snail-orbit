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
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { projectApi } from "shared/model";
import { QueryPagination } from "shared/ui";
import {
    formatErrorMessages,
    perPageOptions,
    useListQueryParams,
} from "shared/utils";
import useDebouncedState from "shared/utils/hooks/use-debounced-state";
import { useCreateIssueNavbarSettings } from "../issues/hooks/use-create-issue-navbar-settings";
import { ProjectCard } from "./components/project_card";

const perPageOptions = [10, 25, 50, 100, 500, 1000];

const ProjectList = () => {
    const { t } = useTranslation();
    useCreateIssueNavbarSettings();

    const [debouncedSearch, setSearch] = useDebouncedState<string>("");
    const [listQueryParams, updateListQueryParams] = useListQueryParams();

    const { data, isLoading, error } = projectApi.useListProjectQuery({
        ...listQueryParams,
        search: debouncedSearch,
    });

    const projects = data?.payload?.items || [];
    const count = data?.payload?.count || 0;

    return (
        <Container
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                height: "100%",
                px: 4,
            }}
            disableGutters
        >
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="stretch"
                gap={1}
            >
                <TextField
                    fullWidth
                    size="small"
                    placeholder={t("agileBoards.list.search.placeholder")}
                    value={listQueryParams.search}
                    onChange={(event) => setSearch(event.target.value)}
                />

                <Link to="/projects/create">
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        sx={{ textWrap: "nowrap", height: "40px" }}
                    >
                        {t("projects.new")}
                    </Button>
                </Link>
            </Stack>

            {error && (
                <Typography>
                    {formatErrorMessages(error) ||
                        t("projects.list.fetch.error")}
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
                            {t("projects.count", { count })}
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
                        {projects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
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

export { ProjectList };
