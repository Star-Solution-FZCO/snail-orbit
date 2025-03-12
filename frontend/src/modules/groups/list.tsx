import AddIcon from "@mui/icons-material/Add";
import {
    Box,
    Button,
    CircularProgress,
    Container,
    Stack,
    Typography,
} from "@mui/material";
import { ErrorHandler, Link, QueryPagination } from "components";
import { useTranslation } from "react-i18next";
import { groupApi } from "store";
import { useListQueryParams } from "utils";

const GroupList = () => {
    const { t } = useTranslation();

    const [listQueryParams, updateListQueryParams] = useListQueryParams();

    const {
        data: groups,
        isLoading,
        error,
    } = groupApi.useListGroupQuery(listQueryParams);

    if (error) {
        return <ErrorHandler error={error} message="groups.list.fetch.error" />;
    }

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
            <Stack
                direction="row"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
            >
                <Typography fontSize={24} fontWeight="bold">
                    {t("groups.title")}
                </Typography>

                <Link to="/groups/create">
                    <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        size="small"
                    >
                        {t("groups.new")}
                    </Button>
                </Link>
            </Stack>

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
                            <Link
                                key={group.id}
                                to="/groups/$groupId"
                                params={{ groupId: group.id }}
                                fontWeight="bold"
                            >
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
