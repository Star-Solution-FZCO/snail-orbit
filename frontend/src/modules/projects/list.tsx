import AddIcon from "@mui/icons-material/Add";
import {
    Box,
    CircularProgress,
    Container,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { projectApi } from "shared/model";
import { QueryPagination } from "shared/ui";
import { NavbarActionButton } from "shared/ui/navbar/navbar_action_button";
import { useNavbarSettings } from "shared/ui/navbar/navbar_settings";
import { formatErrorMessages, useListQueryParams } from "shared/utils";
import useDebouncedState from "../../shared/utils/hooks/use-debounced-state";
import { ProjectCard } from "./components/project_card";

const ProjectList = () => {
    const { t } = useTranslation();
    const { setAction } = useNavbarSettings();

    const [debouncedSearch, setSearch] = useDebouncedState<string>("");
    const [listQueryParams, updateListQueryParams] = useListQueryParams();

    const { data, isLoading, error } = projectApi.useListProjectQuery({
        ...listQueryParams,
        search: debouncedSearch,
    });

    useEffect(() => {
        setAction(
            <Link to="/projects/create">
                <NavbarActionButton startIcon={<AddIcon />}>
                    {t("projects.new")}
                </NavbarActionButton>
            </Link>,
        );

        return () => setAction(null);
    }, [setAction, t]);

    const projects = data?.payload?.items || [];
    const count = data?.payload?.count || 0;

    return (
        <Container
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                height: "100%",
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
                    fullWidth
                    size="small"
                    placeholder={t("agileBoards.list.search.placeholder")}
                    value={listQueryParams.search}
                    onChange={(event) => setSearch(event.target.value)}
                />
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
                    <Box
                        display="flex"
                        flexDirection="column"
                        gap={2}
                        flex={1}
                        overflow="auto"
                    >
                        {projects.length === 0 && (
                            <Typography>{t("projects.no_projects")}</Typography>
                        )}

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
