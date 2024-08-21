import AddIcon from "@mui/icons-material/Add";
import { Box, IconButton, Typography } from "@mui/material";
import { Link } from "components";
import { useTranslation } from "react-i18next";
import { agileBoardApi } from "store";

const AgileBoardList = () => {
    const { t } = useTranslation();

    const { data: boards } = agileBoardApi.useListAgileBoardQuery();

    return (
        <Box display="flex" flexDirection="column" px={4} pb={4} height="100%">
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                <Box display="flex" alignItems="center" gap={1}>
                    <Typography fontSize={24} fontWeight="bold">
                        {t("agileBoards.title")}
                    </Typography>

                    <Link to="/agiles/create">
                        <IconButton size="small">
                            <AddIcon />
                        </IconButton>
                    </Link>
                </Box>
            </Box>

            <Box
                display="flex"
                flexDirection="column"
                alignItems="flex-start"
                gap={2}
                mt={4}
            >
                {boards?.payload?.items?.length === 0 && (
                    <Typography>{t("agileBoards.empty")}</Typography>
                )}

                {boards?.payload?.items?.map((board) => (
                    <Link to={`/agiles/${board.id}`} fontWeight="bold">
                        {board.name}
                    </Link>
                ))}
            </Box>
        </Box>
    );
};

export { AgileBoardList };
