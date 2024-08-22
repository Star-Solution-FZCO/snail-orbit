import AddIcon from "@mui/icons-material/Add";
import { Box, Divider, IconButton, Typography } from "@mui/material";
import { Link } from "components";
import { useTranslation } from "react-i18next";
import { roleApi } from "store";

const RoleList = () => {
    const { t } = useTranslation();

    const { data: roles } = roleApi.useListRoleQuery();

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
                        {t("roles.title")}
                    </Typography>

                    <Link to="/roles/create">
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
                {roles?.payload?.items?.length === 0 && (
                    <Typography>{t("roles.empty")}</Typography>
                )}

                {roles?.payload?.items?.map((role) => (
                    <Link to={`/roles/${role.id}`} fontWeight="bold">
                        {role.name}
                    </Link>
                ))}
            </Box>
        </Box>
    );
};

export { RoleList };
