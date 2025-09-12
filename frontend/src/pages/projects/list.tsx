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
import { useCreateIssueNavbarSettings } from "modules/issues/hooks/use-create-issue-navbar-settings";
import { ProjectCard } from "modules/projects/components/project_card";
import { useTranslation } from "react-i18next";
import { projectApi, useAppSelector } from "shared/model";
import { QueryPagination } from "shared/ui";
import { formatErrorMessages, useListQueryParams } from "shared/utils";
import useDebouncedState from "shared/utils/hooks/use-debounced-state";

const perPageOptions = [10, 25, 50, 100, 500, 1000];

const ProjectList = () => {
    const { t } = useTranslation();
    useCreateIssueNavbarSettings();

    const [debouncedSearch, setSearch] = useDebouncedState<string>("");
    const [listQueryParams, updateListQueryParams] = useListQueryParams();

    const isAdmin = useAppSelector(
        (state) => state.profile.user?.is_admin || false,
    );
    const userAccessClaims =
        useAppSelector((state) => state.profile.user?.access_claims) || [];

    const { data, isLoading, error } = projectApi.useListProjectQuery({
        ...listQueryParams,
        search: debouncedSearch,
    });

    const projects = data?.payload?.items || [];
    const count = data?.payload?.count || 0;
    const canCreateProject =
        isAdmin || userAccessClaims.includes("global:project_create");

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

                {canCreateProject && (
                    <Link to="/projects/create">
                        <Button
                            sx={{ textWrap: "nowrap", height: "40px" }}
                            size="small"
                            variant="outlined"
                            startIcon={<AddIcon />}
                        >
                            {t("projects.new")}
                        </Button>
                    </Link>
                )}
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
