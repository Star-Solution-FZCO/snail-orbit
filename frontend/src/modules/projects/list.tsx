import AddIcon from "@mui/icons-material/Add";
import { Box, IconButton, Typography } from "@mui/material";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { projectApi } from "store";
import { ProjectCard } from "./components/project_card";

const ProjectList = () => {
    const { t } = useTranslation();

    const { data: projects } = projectApi.useListProjectQuery();

    return (
        <Box
            margin="0 auto"
            width="1080px"
            display="flex"
            flexDirection="column"
        >
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
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

            <Box display="flex" flexDirection="column" gap={2} mt={4}>
                {projects?.payload?.items?.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </Box>
        </Box>
    );
};

export { ProjectList };
