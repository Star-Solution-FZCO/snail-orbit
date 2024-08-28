import { TabContext, TabList } from "@mui/lab";
import { Box, Tab, Typography } from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { TabPanel } from "components";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { projectApi } from "store";
import { ProjectGeneralInfo } from "./components/general_info";
import { ProjectCustomFields } from "./components/project_custom_fields";
import { ProjectWorkflows } from "./components/project_workflows";
import { tabs } from "./utils";

const routeApi = getRouteApi("/_authenticated/projects/$projectId");

const ProjectView = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { projectId } = routeApi.useParams();
    const search = routeApi.useSearch();

    const [currentTab, setCurrentTab] = useState(search?.tab || "general");

    const { data } = projectApi.useGetProjectQuery(projectId);

    const handleChangeTab = (_: React.SyntheticEvent, value: string) => {
        setCurrentTab(value);
        navigate({ search: { tab: value } });
    };

    if (!data) return null;

    const project = data.payload;

    return (
        <Box
            display="flex"
            flexDirection="column"
            px={4}
            pb={2}
            gap={2}
            flex={1}
        >
            <Box display="flex" alignItems="center">
                <Typography fontSize={24} fontWeight="bold">
                    {project.name}
                </Typography>
            </Box>

            <Box display="flex" flexDirection="column" flex={1}>
                <TabContext value={currentTab}>
                    <Box borderBottom={1} borderColor="divider" mb={2}>
                        <TabList
                            onChange={handleChangeTab}
                            variant="scrollable"
                        >
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
                        <ProjectCustomFields project={project} />
                    </TabPanel>

                    <TabPanel value="workflows">
                        <ProjectWorkflows project={project} />
                    </TabPanel>
                </TabContext>
            </Box>
        </Box>
    );
};

export { ProjectView };
