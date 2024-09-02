import AddIcon from "@mui/icons-material/Add";
import {
    Box,
    Button,
    CircularProgress,
    Container,
    Stack,
    Typography,
} from "@mui/material";
import { Link } from "@tanstack/react-router";
import { QueryPagination } from "components";
import { useTranslation } from "react-i18next";
import { projectApi } from "store";
import { useListQueryParams } from "utils";
import { ProjectCard } from "./components/project_card";

const ProjectList = () => {
    const { t } = useTranslation();

    const [listQueryParams, updateListQueryParams] = useListQueryParams();

    const { data: projects, isLoading } =
        projectApi.useListProjectQuery(listQueryParams);

    return (
        <Container
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                height: "100%",
                px: 4,
                pb: 4,
            }}
            disableGutters
        >
            <Stack
                direction="row"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
            >
                <Typography fontSize={24} fontWeight="bold">
                    {t("projects.title")}
                </Typography>

                <Link to="/projects/create">
                    <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        size="small"
                    >
                        {t("projects.new")}
                    </Button>
                </Link>
            </Stack>

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
                        {projects?.payload?.items.length === 0 && (
                            <Typography>{t("projects.no_projects")}</Typography>
                        )}

                        {projects?.payload?.items?.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </Box>

                    <QueryPagination
                        count={projects?.payload?.count || 0}
                        queryParams={listQueryParams}
                        updateQueryParams={updateListQueryParams}
                    />
                </>
            )}
        </Container>
    );
};

export { ProjectList };
