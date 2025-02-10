import AddIcon from "@mui/icons-material/Add";
import { Box, CircularProgress, Container, Typography } from "@mui/material";
import { Link } from "@tanstack/react-router";
import {
    NavbarActionButton,
    QueryPagination,
    useNavbarSettings,
} from "components";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { projectApi } from "store";
import { formatErrorMessages, useListQueryParams } from "utils";
import { ProjectCard } from "./components/project_card";

const ProjectList = () => {
    const { t } = useTranslation();
    const { setAction } = useNavbarSettings();

    const [listQueryParams, updateListQueryParams] = useListQueryParams();

    const {
        data: projects,
        isLoading,
        error,
    } = projectApi.useListProjectQuery(listQueryParams);

    useEffect(() => {
        setAction(
            <Link to="/projects/create">
                <NavbarActionButton startIcon={<AddIcon />}>
                    {t("projects.new")}
                </NavbarActionButton>
            </Link>,
        );

        return () => setAction(null);
    }, [setAction]);

    return (
        <Container
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                height: "100%",
                p: 4,
            }}
            disableGutters
        >
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
