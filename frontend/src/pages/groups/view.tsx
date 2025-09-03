import { TabContext, TabList } from "@mui/lab";
import { Box, Breadcrumbs, Tab, Typography } from "@mui/material";
import { getRouteApi } from "@tanstack/react-router";
import { GroupMembers } from "modules/groups/components/group_members";
import { GroupSettings } from "modules/groups/components/group_settings";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { groupApi } from "shared/model";
import { ErrorHandler, Link, TabPanel } from "shared/ui";
import { tabs } from "./utils";

const routeApi = getRouteApi("/_authenticated/groups/$groupId");

const GroupView = () => {
    const { t } = useTranslation();
    const navigate = routeApi.useNavigate();
    const { groupId } = routeApi.useParams();
    const search = routeApi.useSearch();

    const [currentTab, setCurrentTab] = useState(search?.tab || "members");

    const { data, error } = groupApi.useGetGroupQuery(groupId);

    const handleChangeTab = (_: React.SyntheticEvent, value: string) => {
        setCurrentTab(value);
        navigate({ search: { tab: value } });
    };

    if (error) {
        return <ErrorHandler error={error} message="groups.item.fetch.error" />;
    }

    if (!data) return null;

    const group = data.payload;

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
