import { TabContext, TabList } from "@mui/lab";
import { Box, Breadcrumbs, Tab, Typography } from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ErrorHandler, Link, TabPanel } from "shared/ui";
import { roleApi } from "shared/model";
import { RolePermissions } from "./components/role_permissions";
import { RoleSettings } from "./components/role_settings";
import { tabs } from "./utils";

const routeApi = getRouteApi("/_authenticated/roles/$roleId");

const RoleView = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { roleId } = routeApi.useParams();
    const search = routeApi.useSearch();

    const [currentTab, setCurrentTab] = useState(search?.tab || "settings");

    const { data, error } = roleApi.useGetRoleQuery(roleId);

    const handleChangeTab = (_: React.SyntheticEvent, value: string) => {
        setCurrentTab(value);
        // @ts-ignore
        navigate({ search: { tab: value } });
    };

    if (error) {
        return <ErrorHandler error={error} message="roles.item.fetch.error" />;
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
                <Link to="/roles" underline="hover">
                    <Typography fontSize={24} fontWeight="bold">
                        {t("roles.title")}
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
                        <RoleSettings role={role} />
                    </TabPanel>

                    <TabPanel value="permissions">
                        <RolePermissions role={role} />
                    </TabPanel>
                </TabContext>
            </Box>
        </Box>
    );
};

export { RoleView };
