import AddIcon from "@mui/icons-material/Add";
import { Box, Divider, IconButton, Typography } from "@mui/material";
import { Link } from "components";
import { useTranslation } from "react-i18next";
import { groupApi } from "store";

const GroupList = () => {
    const { t } = useTranslation();

    const { data: groups } = groupApi.useListGroupQuery();

    return (
        <Box display="flex" flexDirection="column" px={4} pb={4} height="100%">
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
            >
                <Box display="flex" alignItems="center" gap={1}>
                    <Typography fontSize={24} fontWeight="bold">
                        {t("groups.title")}
                    </Typography>

                    <Link to="/groups/create">
                        <IconButton size="small">
                            <AddIcon />
                        </IconButton>
                    </Link>
                </Box>
            </Box>

            <Divider flexItem />

            <Box
                display="flex"
                flexDirection="column"
                alignItems="flex-start"
                gap={2}
                mt={4}
            >
                {groups?.payload?.items?.length === 0 && (
                    <Typography>{t("groups.empty")}</Typography>
                )}

                {groups?.payload?.items?.map((group) => (
                    <Link to={`/groups/${group.id}`} fontWeight="bold">
                        {group.name}
                    </Link>
                ))}
            </Box>
        </Box>
    );
};

export { GroupList };
