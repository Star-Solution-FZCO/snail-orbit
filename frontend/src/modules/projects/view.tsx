import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, Tab, Typography } from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { projectApi } from "store";
import { ProjectGeneralInfo } from "./components/general_info";
import { tabs } from "./utils";

const routeApi = getRouteApi("/_authenticated/projects/$projectId");

type ProjectViewSearch = {
    tab?: string;
};

const ProjectView = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { projectId } = routeApi.useParams();
    const search: ProjectViewSearch = routeApi.useSearch();

    const [currentTab, setCurrentTab] = useState(search?.tab || "general");

    const { data } = projectApi.useGetProjectQuery(projectId);

    const handleChangeTab = (_: React.SyntheticEvent, value: string) => {
        setCurrentTab(value);
        navigate({ search: { tab: value } });
    };

    if (!data) return null;

    const project = data.payload;

    return (
        <Box display="flex" flexDirection="column" px={4} gap={2}>
            <Box display="flex" alignItems="center">
                <Typography fontSize={24} fontWeight="bold">
                    {project.name}
                </Typography>
            </Box>

            <Box display="flex" flexDirection="column">
                <TabContext value={currentTab}>
                    <Box borderBottom={1} borderColor="divider">
                        <TabList onChange={handleChangeTab}>
                            {tabs.map((tab) => (
                                <Tab
                                    key={tab.value}
                                    label={t(tab.label)}
                                    value={tab.value}
                                />
                            ))}
                        </TabList>
                    </Box>

                    <TabPanel value="general">
                        <ProjectGeneralInfo project={project} />
                    </TabPanel>

                    <TabPanel value="access">
                        <Typography fontSize={24} fontWeight="bold">
                            {t("projects.sections.access")}
                        </Typography>
                    </TabPanel>

                    <TabPanel value="members">
                        <Typography fontSize={24} fontWeight="bold">
                            {t("projects.sections.members")}
                        </Typography>
                    </TabPanel>

                    <TabPanel value="custom-fields">
                        <Typography fontSize={24} fontWeight="bold">
                            {t("projects.sections.customFields")}
                        </Typography>
                    </TabPanel>

                    <TabPanel value="workflows">
                        <Typography fontSize={24} fontWeight="bold">
                            {t("projects.sections.workflows")}
                        </Typography>
                    </TabPanel>
                </TabContext>
            </Box>
        </Box>
    );
};

export { ProjectView };
