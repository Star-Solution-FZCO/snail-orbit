import { TabContext, TabList } from "@mui/lab";
import { Box, Stack, Tab, Typography } from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { ErrorHandler, TabPanel } from "components";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { userApi } from "store";
import { AccountSecurity } from "./components/account_security";
import { APITokenList } from "./components/api_tokens";
import { tabs } from "./utils";

const routeApi = getRouteApi("/_authenticated/profile/");

export const ProfileView = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const search = routeApi.useSearch();

    const [currentTab, setCurrentTab] = useState(search?.tab || "api_tokens");

    const { data, error } = userApi.useGetProfileQuery();

    const handleChangeTab = (_: React.SyntheticEvent, value: string) => {
        setCurrentTab(value);
        navigate({ search: { tab: value } });
    };

    if (error) {
        return <ErrorHandler error={error} message="users.item.fetch.error" />;
    }

    if (!data) return null;

    const profile = data.payload;

    return (
        <Stack px={4} pb={4} gap={2} height={1}>
            <Typography fontSize={24} fontWeight="bold">
                {profile.name}
            </Typography>

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

                    <TabPanel value="api_tokens">
                        <APITokenList />
                    </TabPanel>

                    <TabPanel value="security">
                        <AccountSecurity />
                    </TabPanel>
                </TabContext>
            </Box>
        </Stack>
    );
};
