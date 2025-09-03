import AddIcon from "@mui/icons-material/Add";
import {
    Box,
    Button,
    CircularProgress,
    Container,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { BoardsList } from "modules/agile_boards/components/list/boards_list";
import { useCreateIssueNavbarSettings } from "modules/issues/hooks/use-create-issue-navbar-settings";
import { useTranslation } from "react-i18next";
import { agileBoardApi } from "shared/model";
import { Link, QueryPagination } from "shared/ui";
import { formatErrorMessages, useListQueryParams } from "shared/utils";

const perPageOptions = [10, 25, 50, 100, 500, 1000];

const AgileBoardList = () => {
    const { t } = useTranslation();

    useCreateIssueNavbarSettings();

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
                gap: 2,
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

                <Link to="/agiles/create">
                    <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        sx={{ textWrap: "nowrap", height: "40px" }}
                    >
                        {t("agileBoards.create.title")}
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
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                    >
                        <Typography
                            fontSize={12}
                            color="textDisabled"
                            variant="subtitle2"
                        >
                            {boards?.payload?.count
                                ? `${boards?.payload?.count} boards`
                                : null}
                        </Typography>

                        <Stack direction="row" alignItems="center" gap={1}>
                            <Typography variant="subtitle2">
                                {t("pagination.showRows")}:
                            </Typography>

                            <Select
                                sx={{
                                    ".MuiSelect-select": {
                                        py: 0.5,
                                        pl: 1,
                                        pr: 2,
                                    },
                                }}
                                value={listQueryParams.limit}
                                renderValue={() => listQueryParams.limit}
                                onChange={(e) =>
                                    updateListQueryParams({
                                        limit: +e.target.value,
                                        offset: 0,
                                    })
                                }
                                variant="outlined"
                                size="small"
                            >
                                {perPageOptions.map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {value}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Stack>
                    </Stack>

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
