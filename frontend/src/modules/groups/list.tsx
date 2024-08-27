import AddIcon from "@mui/icons-material/Add";
import { Box, CircularProgress, IconButton, Typography } from "@mui/material";
import { Link, QueryPagination } from "components";
import { useTranslation } from "react-i18next";
import { groupApi } from "store";
import { useListQueryParams } from "utils";

const GroupList = () => {
    const { t } = useTranslation();

    const [listQueryParams, updateListQueryParams] = useListQueryParams();

    const { data: groups, isLoading } = groupApi.useListGroupQuery();

    return (
        <Box display="flex" flexDirection="column" px={4} pb={4} height="100%">
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={4}
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

            {isLoading ? (
                <Box display="flex" justifyContent="center">
                    <CircularProgress size={48} color="inherit" />
                </Box>
            ) : (
                <>
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="flex-start"
                        gap={2}
                        flex={1}
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

                    <QueryPagination
                        count={groups?.payload?.count || 0}
                        queryParams={listQueryParams}
                        updateQueryParams={updateListQueryParams}
                    />
                </>
            )}
        </Box>
    );
};

export { GroupList };
