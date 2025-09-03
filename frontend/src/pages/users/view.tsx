import { TabContext, TabList } from "@mui/lab";
import { Box, Breadcrumbs, Tab, Typography } from "@mui/material";
import { getRouteApi } from "@tanstack/react-router";
import { UserSettings } from "modules/users/components/user_general_settings";
import { UserGlobalRoles } from "modules/users/components/user_global_roles";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { userApi } from "shared/model";
import { ErrorHandler, Link, TabPanel } from "shared/ui";
import { tabs } from "./utils";

const routeApi = getRouteApi("/_authenticated/users/$userId");

const UserView = () => {
    const { t } = useTranslation();
    const navigate = routeApi.useNavigate();
    const { userId } = routeApi.useParams();
    const search = routeApi.useSearch();

    const [currentTab, setCurrentTab] = useState(search?.tab || "general");

    const { data, error } = userApi.useGetUserQuery(userId);

    const handleChangeTab = (_: React.SyntheticEvent, value: string) => {
        setCurrentTab(value);
        navigate({ search: { tab: value } });
    };

    if (error) {
        return <ErrorHandler error={error} message="users.item.fetch.error" />;
    }

    if (!data) return null;

    const user = data.payload;

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
                <Link to="/users" underline="hover">
                    <Typography fontSize={24} fontWeight="bold">
                        {t("users.title")}
                    </Typography>
                </Link>
                <Typography fontSize={24} fontWeight="bold">
                    {user.name}
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

                    <TabPanel value="general">
                        <UserSettings user={user} />
                    </TabPanel>

                    <TabPanel value="globalRoles" sx={{ flex: 1 }}>
                        <UserGlobalRoles userId={user.id} />
                    </TabPanel>
                </TabContext>
            </Box>
        </Box>
    );
};

export { UserView };
