import AddIcon from "@mui/icons-material/Add";
import { TabContext, TabList } from "@mui/lab";
import { Box, Tab, Typography } from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { ErrorHandler, Link, SubscribeButton, TabPanel } from "components";
import { NavbarActionButton } from "components/navbar/navbar_action_button";
import { useNavbarSettings } from "components/navbar/navbar_settings";
import { SyntheticEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { projectApi, useAppSelector } from "store";
import { ProjectGeneralInfo } from "./components/general_info";
import { ProjectAccess } from "./components/project_access";
import { ProjectCustomFields } from "./components/project_custom_fields";
import { ProjectListView } from "./components/project_list_view";
import { ProjectWorkflows } from "./components/project_workflows";
import { ProjectFormTabKey, useProjectFormTabs } from "./utils";

const routeApi = getRouteApi("/_authenticated/projects/$projectId");

const ProjectView = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { projectId } = routeApi.useParams();
    const search = routeApi.useSearch();
    const { setAction } = useNavbarSettings();

    const tabs = useProjectFormTabs();

    const isAdmin = useAppSelector((state) => state.profile.user?.is_admin);

    const [currentTab, setCurrentTab] = useState(search?.tab || "general");

    const { data, error } = projectApi.useGetProjectQuery(projectId);

    const [subscribe] = projectApi.useSubscribeProjectMutation();
    const [unsubscribe] = projectApi.useUnsubscribeProjectMutation();

    const handleToggleSubscribeButton = () => {
        const mutation = project.is_subscribed ? unsubscribe : subscribe;
        mutation(project.id);
    };

    const handleChangeTab = (_: SyntheticEvent, value: string) => {
        setCurrentTab(value);
        // @ts-ignore
        navigate({ search: { tab: value } });
    };

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

    useEffect(() => {
        setCurrentTab(search?.tab || "general");
    }, [search?.tab]);

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
            <Box display="flex" alignItems="center" gap={2}>
                <Typography fontSize={24} fontWeight="bold">
                    {project.name}
                </Typography>

                <SubscribeButton
                    isSubscribed={project.is_subscribed}
                    onToggle={handleToggleSubscribeButton}
                    type="project"
                />
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

                    <TabPanel value={ProjectFormTabKey.GENERAL}>
                        <ProjectGeneralInfo project={project} />
                    </TabPanel>

                    {isAdmin && (
                        <>
                            <TabPanel value={ProjectFormTabKey.ACCESS}>
                                <ProjectAccess project={project} />
                            </TabPanel>

                            <TabPanel value={ProjectFormTabKey.CUSTOM_FIELDS}>
                                <ProjectCustomFields project={project} />
                            </TabPanel>

                            <TabPanel value={ProjectFormTabKey.WORKFLOWS}>
                                <ProjectWorkflows project={project} />
                            </TabPanel>

                            <TabPanel value={ProjectFormTabKey.LIST_VIEW}>
                                <ProjectListView project={project} />
                            </TabPanel>
                        </>
                    )}
                </TabContext>
            </Box>
        </Box>
    );
};

export { ProjectView };
