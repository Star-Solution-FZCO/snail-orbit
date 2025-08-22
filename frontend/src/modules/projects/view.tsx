import AddIcon from "@mui/icons-material/Add";
import { TabContext, TabList } from "@mui/lab";
import { Box, Tab, Typography } from "@mui/material";
import type { FC, SyntheticEvent } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { projectApi, useAppSelector } from "shared/model";
import { ErrorHandler, Link, TabPanel } from "shared/ui";
import { NavbarActionButton } from "shared/ui/navbar/navbar_action_button";
import { useNavbarSettings } from "shared/ui/navbar/navbar_settings";
import { ProjectGeneralInfo } from "./components/general_info";
import { ProjectAccess } from "./components/project_access";
import { ProjectCustomFields } from "./components/project_custom_fields_tab/project_custom_fields";
import { ProjectEncryptionTab } from "./components/project_encryption_tab/project_encryption_tab";
import { ProjectFavoriteButton } from "./components/project_favorite_button";
import { ProjectListView } from "./components/project_list_view";
import { ProjectSubscribeButton } from "./components/project_subscribe_button";
import { ProjectWorkflows } from "./components/project_workflows";
import { ProjectFormTabKey, useProjectViewTabs } from "./utils";

type ProjectViewProps = {
    tab?: ProjectFormTabKey;
    onTabChange?: (tab: ProjectFormTabKey) => void;
    projectId: string;
};

const ProjectView: FC<ProjectViewProps> = (props) => {
    const { tab, onTabChange, projectId } = props;

    const { t } = useTranslation();
    const { setAction } = useNavbarSettings();

    const [currentTab, setCurrentTab] = useState(
        tab || ProjectFormTabKey.GENERAL,
    );

    const { data, error } = projectApi.useGetProjectQuery(projectId);
    const user = useAppSelector((state) => state.profile.user);

    const isAdmin = user?.is_admin || false;
    const userAccessClaims = user?.access_claims || [];

    const projectAccessClaims = data?.payload?.access_claims || [];
    const projectEncrypted = data?.payload?.is_encrypted || false;

    const tabs = useProjectViewTabs(
        isAdmin,
        projectAccessClaims,
        projectEncrypted,
    );

    const handleChangeTab = (_: SyntheticEvent, value: ProjectFormTabKey) => {
        setCurrentTab(value);
        onTabChange?.(value);
    };

    useEffect(() => {
        const canCreateProject = userAccessClaims.includes(
            "global:project_create",
        );
        const path = canCreateProject ? "/projects/create" : "/issues/create";
        setAction(
            <Link to={path}>
                <NavbarActionButton startIcon={<AddIcon />}>
                    {t(canCreateProject ? "projects.new" : "issues.new")}
                </NavbarActionButton>
            </Link>,
        );

        return () => setAction(null);
    }, [t, userAccessClaims, setAction]);

    useEffect(() => {
        setCurrentTab(tab || ProjectFormTabKey.GENERAL);
    }, [tab]);

    if (error) {
        return (
            <ErrorHandler error={error} message="projects.item.fetch.error" />
        );
    }

    if (!data) return null;

    const project = data.payload;

    return (
        <Box
            display="flex"
            flexDirection="column"
            px={4}
            pb={4}
            gap={2}
            height={1}
        >
            <Box display="flex" alignItems="center" gap={1}>
                <ProjectSubscribeButton project={project} />

                <ProjectFavoriteButton project={project} />

                <Typography fontSize={24} fontWeight="bold">
                    {project.slug} / {project.name}
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

                    <TabPanel value={ProjectFormTabKey.GENERAL}>
                        <ProjectGeneralInfo project={project} />
                    </TabPanel>

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

                    <TabPanel value={ProjectFormTabKey.ENCRYPTION}>
                        <ProjectEncryptionTab project={project} />
                    </TabPanel>
                </TabContext>
            </Box>
        </Box>
    );
};

export { ProjectView };
