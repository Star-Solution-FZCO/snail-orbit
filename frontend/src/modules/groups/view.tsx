import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, Breadcrumbs, Tab, Typography } from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { Link } from "components";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { groupApi } from "store";
import { GroupMembers } from "./components/group_members";
import { GroupSettings } from "./components/group_settings";
import { tabs } from "./utils";

const routeApi = getRouteApi("/_authenticated/groups/$groupId");

const GroupView = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { groupId } = routeApi.useParams();
    const search = routeApi.useSearch();

    const [currentTab, setCurrentTab] = useState(search?.tab || "members");

    const { data } = groupApi.useGetGroupQuery(groupId);

    const handleChangeTab = (_: React.SyntheticEvent, value: string) => {
        setCurrentTab(value);
        navigate({ search: { tab: value } });
    };

    if (!data) return null;

    const group = data.payload;

    return (
        <Box display="flex" flexDirection="column" px={4} gap={2} flex={1}>
            <Breadcrumbs>
                <Link to="/groups" underline="hover">
                    <Typography fontSize={24} fontWeight="bold">
                        {t("groups.title")}
                    </Typography>
                </Link>
                <Typography fontSize={24} fontWeight="bold">
                    {group.name}
                </Typography>
            </Breadcrumbs>

            <Box display="flex" flexDirection="column" flex={1}>
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

                    <TabPanel value="members" sx={{ flex: 1 }}>
                        <GroupMembers groupId={group.id} />
                    </TabPanel>

                    <TabPanel value="settings">
                        <GroupSettings group={group} />
                    </TabPanel>
                </TabContext>
            </Box>
        </Box>
    );
};

export { GroupView };
