import AddIcon from "@mui/icons-material/Add";
import {
    Box,
    CircularProgress,
    Container,
    IconButton,
    Typography,
} from "@mui/material";
import { Link, QueryPagination } from "components";
import { useTranslation } from "react-i18next";
import { groupApi } from "store";
import { useListQueryParams } from "utils";

const GroupList = () => {
    const { t } = useTranslation();

    const [listQueryParams, updateListQueryParams] = useListQueryParams();

    const { data: groups, isLoading } = groupApi.useListGroupQuery();

    return (
        <Container
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                height: "100%",
                px: 4,
                pb: 4,
            }}
            disableGutters
        >
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
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
        </Container>
    );
};

export { GroupList };
