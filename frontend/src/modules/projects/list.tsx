import AddIcon from "@mui/icons-material/Add";
import { Box, CircularProgress, IconButton, Typography } from "@mui/material";
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
        <Box display="flex" justifyContent="center" px={4} pb={2} height="100%">
            <Box
                maxWidth="1080px"
                width="100%"
                height="100%"
                display="flex"
                flexDirection="column"
            >
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={4}
                >
                    <Box display="flex" alignItems="center" gap={1}>
                        <Typography fontSize={24} fontWeight="bold">
                            {t("projects.title")}
                        </Typography>

                        <Link to="/projects/create">
                            <IconButton size="small">
                                <AddIcon />
                            </IconButton>
                        </Link>
                    </Box>
                </Box>

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
                        >
                            {projects?.payload?.items.length === 0 && (
                                <Typography>
                                    {t("projects.no_projects")}
                                </Typography>
                            )}

                            {projects?.payload?.items?.map((project) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                />
                            ))}
                        </Box>

                        <QueryPagination
                            count={projects?.payload?.count || 0}
                            queryParams={listQueryParams}
                            updateQueryParams={updateListQueryParams}
                        />
                    </>
                )}
            </Box>
        </Box>
    );
};

export { ProjectList };
