import { TabContext, TabList } from "@mui/lab";
import { Box, Breadcrumbs, Tab, Typography } from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { roleApi } from "shared/model";
import { ErrorHandler, Link, TabPanel } from "shared/ui";
import { GlobalRolePermissions } from "./components/global_role_permissions";
import { GlobalRoleSettings } from "./components/global_role_settings";
import { tabs } from "./utils";

const routeApi = getRouteApi("/_authenticated/global-roles/$globalRoleId");

const GlobalRoleView = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { globalRoleId } = routeApi.useParams();
    const search = routeApi.useSearch();

    const [currentTab, setCurrentTab] = useState(search?.tab || "settings");

    const { data, error } = roleApi.useGetGlobalRoleQuery(globalRoleId);

    const handleChangeTab = (_: React.SyntheticEvent, value: string) => {
        setCurrentTab(value);
        // @ts-ignore
        navigate({ search: { tab: value } });
    };

    if (error) {
        return (
            <ErrorHandler
                error={error}
                message="globalRoles.item.fetch.error"
            />
        );
    }

    if (!data) return null;

    const role = data.payload;

    return (
        <Box
            display="flex"
            flexDirection="column"
            px={4}
            pb={4}
            gap={2}
            flex={1}
        >
            <Breadcrumbs>
                <Link to="/global-roles" underline="hover">
                    <Typography fontSize={24} fontWeight="bold">
                        {t("globalRoles.title")}
                    </Typography>
                </Link>
                <Typography fontSize={24} fontWeight="bold">
                    {role.name}
                </Typography>
            </Breadcrumbs>

            <Box display="flex" flexDirection="column" flex={1}>
                <TabContext value={currentTab}>
                    <Box borderBottom={1} borderColor="divider" mb={2}>
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

                    <TabPanel value="settings">
                        <GlobalRoleSettings role={role} />
                    </TabPanel>

                    <TabPanel value="permissions">
                        <GlobalRolePermissions role={role} />
                    </TabPanel>
                </TabContext>
            </Box>
        </Box>
    );
};

export { GlobalRoleView };
