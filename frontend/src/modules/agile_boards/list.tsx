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
import { agileBoardApi } from "store";
import { formatErrorMessages, Routes, useListQueryParams } from "utils";

const AgileBoardList = () => {
    const { t } = useTranslation();

    const [listQueryParams, updateListQueryParams] = useListQueryParams();

    const {
        data: boards,
        isLoading,
        error,
    } = agileBoardApi.useListAgileBoardQuery(listQueryParams);

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
                justifyContent="space-between"
                alignItems="center"
                gap={1}
            >
                <Typography fontSize={24} fontWeight="bold">
                    {t("agileBoards.title")}
                </Typography>

                <Link to={Routes.agileBoards.create()}>
                    <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        size="small"
                    >
                        {t("agileBoards.new")}
                    </Button>
                </Link>
            </Stack>

            {error && (
                <Typography>
                    {formatErrorMessages(error) ||
                        t("agileBoards.list.fetch.error")}
                </Typography>
            )}

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
                            <Link
                                key={board.id}
                                to={`/agiles/${board.id}`}
                                fontWeight="bold"
                            >
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
        </Container>
    );
};

export { AgileBoardList };
