import AddIcon from "@mui/icons-material/Add";
import {
    Box,
    CircularProgress,
    Container,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { Link, QueryPagination } from "components";
import { NavbarActionButton } from "components/navbar/navbar_action_button";
import { useNavbarSettings } from "components/navbar/navbar_settings";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { agileBoardApi } from "store";
import { formatErrorMessages, useListQueryParams } from "utils";
import { BoardsList } from "./components/list/boards_list";

const AgileBoardList = () => {
    const { t } = useTranslation();
    const { setAction } = useNavbarSettings();

    const [listQueryParams, updateListQueryParams] = useListQueryParams();

    const {
        data: boards,
        isLoading,
        error,
    } = agileBoardApi.useListAgileBoardQuery(listQueryParams);

    useEffect(() => {
        setAction(
            <Link to="/agiles/create">
                <NavbarActionButton startIcon={<AddIcon />}>
                    {t("agileBoards.new")}
                </NavbarActionButton>
            </Link>,
        );

        return () => setAction(null);
    }, [setAction, t]);

    return (
        <Container
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
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
                <TextField
                    fullWidth
                    size="small"
                    placeholder={t("agileBoards.list.search.placeholder")}
                />
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
                    {boards?.payload?.items?.length === 0 && (
                        <Typography>{t("agileBoards.empty")}</Typography>
                    )}

                    {boards?.payload.items ? (
                        <BoardsList boards={boards?.payload.items} />
                    ) : null}

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
