import { TabContext, TabList } from "@mui/lab";
import { Box, Tab, Typography } from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { ErrorHandler, TabPanel } from "components";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { projectApi, useAppSelector } from "store";
import { ProjectGeneralInfo } from "./components/general_info";
import { ProjectAccess } from "./components/project_access";
import { ProjectCustomFields } from "./components/project_custom_fields";
import { ProjectWorkflows } from "./components/project_workflows";
import { tabs } from "./utils";

const routeApi = getRouteApi("/_authenticated/projects/$projectId");

const ProjectView = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { projectId } = routeApi.useParams();
    const search = routeApi.useSearch();

    const isAdmin = useAppSelector((state) => state.profile.user?.is_admin);

    const [currentTab, setCurrentTab] = useState(search?.tab || "general");

    const { data, error } = projectApi.useGetProjectQuery(projectId);

    const handleChangeTab = (_: React.SyntheticEvent, value: string) => {
        setCurrentTab(value);
        navigate({ search: { tab: value } });
    };

    if (error) {
        return (
            <ErrorHandler error={error} message="projects.item.fetch.error" />
        );
    }

    if (!data) return null;

    const project = data.payload;

    const visibleTabs = tabs.filter((tab) => {
        return !tab.adminOnly || isAdmin;
    });

    return (
        <Box
            display="flex"
            flexDirection="column"
            px={4}
            pb={4}
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
                            {visibleTabs.map((tab) => (
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

                    {isAdmin && (
                        <>
                            <TabPanel value="access">
                                <ProjectAccess project={project} />
                            </TabPanel>

                            <TabPanel value="custom-fields">
                                <ProjectCustomFields project={project} />
                            </TabPanel>

                            <TabPanel value="workflows">
                                <ProjectWorkflows project={project} />
                            </TabPanel>
                        </>
                    )}
                </TabContext>
            </Box>
        </Box>
    );
};

export { ProjectView };
