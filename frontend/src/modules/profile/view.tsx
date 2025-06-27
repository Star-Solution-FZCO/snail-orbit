import { TabContext, TabList } from "@mui/lab";
import { Box, Stack, Tab, Typography } from "@mui/material";
import type { SyntheticEvent } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { userApi } from "shared/model";
import { ErrorHandler, TabPanel } from "shared/ui";
import { AccountSecurity } from "./components/account_security";
import { APITokenList } from "./components/api_tokens";
import { Workspace } from "./components/workspace";
import { useProfilePageTabs } from "./hooks";
import { Keys } from "./tabs/keys/keys";

type ProfileViewProps = {
    tab?: string;
    onTabChange?: (tab: string) => void;
};

export const ProfileView = (props: ProfileViewProps) => {
    const { onTabChange, tab } = props;

    const { t } = useTranslation();
    const tabs = useProfilePageTabs();

    const [currentTab, setCurrentTab] = useState(tab || "api_tokens");

    const { data, error } = userApi.useGetProfileQuery();

    const handleChangeTab = (_: SyntheticEvent, value: string) => {
        setCurrentTab(value);
        onTabChange?.(value);
    };

    useEffect(() => {
        setCurrentTab(tab || "api_tokens");
    }, [tab]);

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

                    <TabPanel value="workspace">
                        <Workspace />
                    </TabPanel>

                    <TabPanel value="keys">
                        <Keys />
                    </TabPanel>
                </TabContext>
            </Box>
        </Stack>
    );
};
