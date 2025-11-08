import { GridView } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/Delete";
import SettingsIcon from "@mui/icons-material/Settings";
import {
    Box,
    Button,
    CircularProgress,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import { AgileBoard } from "modules/agile_boards/components/agile_board";
import { AgileBoardForm } from "modules/agile_boards/components/agile_board_form/agile_board_form";
import { AgileBoardSelect } from "modules/agile_boards/components/agile_board_select";
import { BoardViewList } from "modules/agile_boards/components/board_view_list";
import { DeleteAgileBoardDialog } from "modules/agile_boards/components/delete_dialog";
import { formValuesToCreateForm } from "modules/agile_boards/utils/formValuesToCreateForm";
import { SearchField } from "modules/issues/components/issue/components/search_field";
import { useCreateIssueNavbarSettings } from "modules/issues/hooks/use-create-issue-navbar-settings";
import { useIssueModalView } from "modules/issues/widgets/modal_view/use_modal_view";
import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { agileBoardApi } from "shared/model";
import { useEventSubscriptionAutoReFetch } from "shared/model/api/events.api";
import type { AgileBoardT, IssueT } from "shared/model/types";
import { ErrorHandler, Link, StarButton } from "shared/ui";
import { formatErrorMessages, toastApiError } from "shared/utils";

type AgileBoardViewProps = {
    boardId: string;
    query?: string;
    onQueryChange?: (query: string) => void;
    onBoardSelect?: (board: AgileBoardT) => void;
};

const AgileBoardView: FC<AgileBoardViewProps> = (props) => {
    const { boardId, query, onQueryChange, onBoardSelect } = props;
    const { t } = useTranslation();
    const { openIssueModal } = useIssueModalView();

    useCreateIssueNavbarSettings();
    useEventSubscriptionAutoReFetch({ boards_ids: [boardId] });

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [search, setSearch] = useState<string>(query || "");
    const [mode, setMode] = useState<"board" | "list">("board");

    const {
        data,
        error,
        isError,
        isLoading: isBoardLoading,
    } = agileBoardApi.useGetAgileBoardQuery(boardId);

    const [updateAgileBoard] = agileBoardApi.useUpdateAgileBoardMutation();
    const [favoriteAgileBoard] = agileBoardApi.useFavoriteBoardMutation();

    const agileBoard = data?.payload;

    useEffect(() => {
        setSearch(query || "");
    }, [query, setSearch]);

    const handleChangeSearch = (value: string) => {
        setSearch(value);
        onQueryChange?.(value);
    };

    const handleBoardSelect = useCallback(
        (board: AgileBoardT) => {
            onBoardSelect?.(board);
        },
        [onBoardSelect],
    );

    const onSubmit = useCallback(
        (formData: AgileBoardT) => {
            if (!agileBoard?.id) return;
            updateAgileBoard({
                id: agileBoard.id,
                ...formValuesToCreateForm(formData),
            })
                .unwrap()
                .catch(toastApiError);
        },
        [updateAgileBoard, agileBoard?.id],
    );
    const handleCardDoubleClick = useCallback(
        (issue: IssueT) => openIssueModal(issue.id_readable),
        [openIssueModal],
    );

    if (isBoardLoading)
        return (
            <Box
                sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: 2,
                }}
            >
                <CircularProgress sx={{ w: 52, h: 52 }} />
                {t("agileBoards.loading")}
            </Box>
        );

    if (!agileBoard && isError)
        return (
            <ErrorHandler
                error={error}
                message={t("agileBoards.fetch.error")}
                action={
                    <Link to="/agiles/list">
                        <Button>{t("agileBoards.fetch.error.action")}</Button>
                    </Link>
                }
            />
        );
    if (!agileBoard) return null;

    return (
        <Stack
            direction="column"
            height="100%"
            id="mainContent"
            maxWidth="100dvw"
            overflow="auto"
        >
            <Box px={4}>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    gap={1}
                    mb={2}
                >
                    <AgileBoardSelect
                        value={agileBoard}
                        onChange={handleBoardSelect}
                    />

                    <SearchField value={search} onChange={handleChangeSearch} />

                    {error && (
                        <Typography color="error" fontSize={16}>
                            {formatErrorMessages(error) ||
                                t("issues.list.fetch.error")}
                            !
                        </Typography>
                    )}

                    <Stack direction="row" gap={1}>
                        {settingsOpen && (
                            <IconButton
                                onClick={() =>
                                    setDeleteDialogOpen((prev) => !prev)
                                }
                                color="error"
                            >
                                <DeleteIcon />
                            </IconButton>
                        )}

                        <IconButton
                            onClick={() => setSettingsOpen((prev) => !prev)}
                            color="primary"
                        >
                            <SettingsIcon />
                        </IconButton>

                        <IconButton
                            onClick={() =>
                                setMode((prev) =>
                                    prev === "board" ? "list" : "board",
                                )
                            }
                        >
                            <GridView />
                        </IconButton>

                        <StarButton
                            starred={agileBoard.is_favorite}
                            onClick={() =>
                                favoriteAgileBoard({
                                    boardId: agileBoard.id,
                                    favorite: !agileBoard.is_favorite,
                                })
                            }
                            disableRipple={false}
                        />
                    </Stack>
                </Stack>

                {settingsOpen && agileBoard ? (
                    <Box mb={2}>
                        <AgileBoardForm
                            onSubmit={onSubmit}
                            board={agileBoard}
                        />
                    </Box>
                ) : null}
            </Box>

            <Box sx={{ width: "100%" }}>
                {mode === "board" ? (
                    <AgileBoard
                        boardData={agileBoard}
                        query={search}
                        onCardDoubleClick={handleCardDoubleClick}
                    />
                ) : (
                    <Box px={4}>
                        <BoardViewList boardData={agileBoard} query={search} />
                    </Box>
                )}
            </Box>

            <DeleteAgileBoardDialog
                id={agileBoard.id}
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            />
        </Stack>
    );
};

export { AgileBoardView };
