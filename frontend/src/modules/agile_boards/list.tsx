import AddIcon from "@mui/icons-material/Add";
import { Box, CircularProgress, IconButton, Typography } from "@mui/material";
import { Link, QueryPagination } from "components";
import { useTranslation } from "react-i18next";
import { agileBoardApi } from "store";
import { useListQueryParams } from "utils";

const AgileBoardList = () => {
    const { t } = useTranslation();

    const [listQueryParams, updateListQueryParams] = useListQueryParams();

    const { data: boards, isLoading } =
        agileBoardApi.useListAgileBoardQuery(listQueryParams);

    return (
        <Box display="flex" flexDirection="column" px={4} pb={2} height="100%">
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={4}
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
                        {boards?.payload?.items?.length === 0 && (
                            <Typography>{t("agileBoards.empty")}</Typography>
                        )}

                        {boards?.payload?.items?.map((board) => (
                            <Link to={`/agiles/${board.id}`} fontWeight="bold">
                                {board.name}
                            </Link>
                        ))}
                    </Box>

                    <QueryPagination
                        count={boards?.payload?.count || 0}
                        queryParams={listQueryParams}
                        updateQueryParams={updateListQueryParams}
                    />
                </>
            )}
        </Box>
    );
};

export { AgileBoardList };
