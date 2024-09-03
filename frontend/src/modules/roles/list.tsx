import AddIcon from "@mui/icons-material/Add";
import {
    Box,
    Button,
    CircularProgress,
    Container,
    Stack,
    Typography,
} from "@mui/material";
import { Link, QueryPagination } from "components";
import { useTranslation } from "react-i18next";
import { roleApi } from "store";
import { useListQueryParams } from "utils";

const RoleList = () => {
    const { t } = useTranslation();

    const [listQueryParams, updateListQueryParams] = useListQueryParams();

    const { data: roles, isLoading } =
        roleApi.useListRoleQuery(listQueryParams);

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
                    {t("roles.title")}
                </Typography>

                <Link to="/roles/create">
                    <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        size="small"
                    >
                        {t("roles.new")}
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
                        {roles?.payload?.items?.length === 0 && (
                            <Typography>{t("roles.empty")}</Typography>
                        )}

                        {roles?.payload?.items?.map((role) => (
                            <Link
                                key={role.id}
                                to={`/roles/${role.id}`}
                                fontWeight="bold"
                            >
                                {role.name}
                            </Link>
                        ))}
                    </Box>

                    <QueryPagination
                        count={roles?.payload?.count || 0}
                        queryParams={listQueryParams}
                        updateQueryParams={updateListQueryParams}
                    />
                </>
            )}
        </Container>
    );
};

export { RoleList };
