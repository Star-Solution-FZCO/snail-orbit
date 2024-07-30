import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { Box, IconButton, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ProjectCard } from "./components/project_card";

const mockProjects = [
    {
        id: "1",
        name: "Project 1",
        description: "Description 1",
    },
    {
        id: "2",
        name: "Project 2",
        description: "Description 2",
    },
    {
        id: "3",
        name: "Project 3",
        description: "Description 3",
    },
];

const ProjectList = () => {
    const { t } = useTranslation();

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
                        {t("PROJECTS:TITLE")}
                    </Typography>

                    <IconButton size="small">
                        <AddIcon />
                    </IconButton>
                </Box>

                <TextField
                    placeholder={t("PROJECTS:SEARCH_PLACEHOLDER")}
                    InputProps={{
                        startAdornment: <SearchIcon />,
                    }}
                    size="small"
                    variant="outlined"
                />
            </Box>

            <Box display="flex" flexDirection="column" gap={2} mt={4}>
                {mockProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </Box>
        </Box>
    );
};

export { ProjectList };
