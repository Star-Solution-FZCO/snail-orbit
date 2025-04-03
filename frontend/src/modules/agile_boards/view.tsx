import { GridView, ListAlt } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import SettingsIcon from "@mui/icons-material/Settings";
import {
    Box,
    Button,
    Container,
    Divider,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { StarButton } from "components";
import { bindPopover, bindTrigger } from "material-ui-popup-state";
import { usePopupState } from "material-ui-popup-state/hooks";
import type { FC, SyntheticEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { agileBoardApi } from "store";
import type { AgileBoardT, IssueT } from "types";
import type { SearchT } from "types/search";
import { formatErrorMessages, toastApiError } from "utils";
import useDebouncedState from "utils/hooks/use-debounced-state";
import { SearchSelectPopover } from "widgets/search_select/search_select_popover";
import { useEventSubscriptionAutoReFetch } from "../../store/api/events.api";
import { QueryBuilder } from "../issues/components/query_builder/query_builder";
import { useIssueModalView } from "../issues/widgets/modal_view/use_modal_view";
import { AgileBoard } from "./components/agile_board";
import { AgileBoardForm } from "./components/agile_board_form/agile_board_form";
import { AgileBoardSelect } from "./components/agile_board_select";
import { BoardViewList } from "./components/board_view_list";
import { DeleteAgileBoardDialog } from "./components/delete_dialog";
import { useViewNavbarSettings } from "./hooks/use-view-navbar-settings";
import { formValuesToCreateForm } from "./utils/formValuesToCreateForm";
import { setLastViewBoardId } from "./utils/lastViewBoardStorage";

type AgileBoardViewProps = {
    boardId: string;
    query?: string;
    onQueryChange?: (query: string) => void;
    onGoToList?: () => void;
    onBoardSelect?: (board: AgileBoardT) => void;
};

const AgileBoardView: FC<AgileBoardViewProps> = (props) => {
    const { boardId, query, onQueryChange, onGoToList, onBoardSelect } = props;
    const { t } = useTranslation();
    const { openIssueModal } = useIssueModalView();

    useViewNavbarSettings();
    useEventSubscriptionAutoReFetch({ boards_ids: [boardId] });

    const searchSelectPopoverState = usePopupState({
        variant: "popover",
        popupId: "search-select",
    });

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [showQueryBuilder, setShowQueryBuilder] = useState<boolean>(false);
    const [debouncedSearch, setSearch, searchQuery] = useDebouncedState<string>(
        query || "",
    );
    const [mode, setMode] = useState<"board" | "list">("board");

    const { data, error } = agileBoardApi.useGetAgileBoardQuery(boardId);

    const [updateAgileBoard] = agileBoardApi.useUpdateAgileBoardMutation();

    const [favoriteAgileBoard] = agileBoardApi.useFavoriteBoardMutation();

    const agileBoard = useMemo(() => data?.payload, [data]);

    useEffect(() => {
        setSearch(query || "");
    }, [query, setSearch]);

    useEffect(() => {
        onQueryChange?.(debouncedSearch);
    }, [debouncedSearch, onQueryChange]);

    useEffect(() => {
        setLastViewBoardId(boardId);
    }, [boardId]);

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

    const goToFullListHandler = useCallback(() => {
        onGoToList?.();
    }, [onGoToList]);

    const handleSavedSearchSelect = (
        _: SyntheticEvent,
        value: SearchT | SearchT[] | null,
    ) => {
        if (!value) return;
        const query = Array.isArray(value) ? value[0].query : value.query;
        setSearch(query);
    };

    const handleCardDoubleClick = useCallback(
        (issue: IssueT) => openIssueModal(issue.id),
        [openIssueModal],
    );

    if (error) {
        return (
            <Container
                sx={{
                    px: 4,
                    pb: 4,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                }}
                disableGutters
            >
                <Typography fontSize={24} fontWeight="bold">
                    {formatErrorMessages(error) ||
                        t("agileBoards.item.fetch.error")}
                </Typography>
                <Button onClick={goToFullListHandler} variant="contained">
                    {t("agileBoards.returnToList")}
                </Button>
            </Container>
        );
    }

    if (!agileBoard) return null;

    return (
        <Box
            component={PanelGroup}
            direction="horizontal"
            autoSaveId="agileBoardView"
            id="agileBoardView"
            style={{ overflow: "visible" }}
        >
            <Stack
                direction="column"
                height="100%"
                minSize={65}
                component={Panel}
                order={5}
                id="mainContent"
                maxWidth="100dvw"
                overflow="auto"
                style={{ overflow: "visible" }}
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
                            onGoToListClick={goToFullListHandler}
                        />

                        <TextField
                            fullWidth
                            value={searchQuery}
                            onChange={(e) => setSearch(e.currentTarget.value)}
                            size="small"
                            placeholder={t("agileBoard.search.placeholder")}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Tooltip
                                                title={t(
                                                    "searchListIcon.tooltip",
                                                )}
                                            >
                                                <IconButton
                                                    size="small"
                                                    color={
                                                        searchSelectPopoverState.isOpen
                                                            ? "primary"
                                                            : "default"
                                                    }
                                                    {...bindTrigger(
                                                        searchSelectPopoverState,
                                                    )}
                                                >
                                                    <ListAlt />
                                                </IconButton>
                                            </Tooltip>
                                            <SearchSelectPopover
                                                {...bindPopover(
                                                    searchSelectPopoverState,
                                                )}
                                                initialQueryString={searchQuery}
                                                onChange={
                                                    handleSavedSearchSelect
                                                }
                                            />
                                            <Tooltip
                                                title={t(
                                                    "queryBuilderIcon.tooltip",
                                                )}
                                            >
                                                <IconButton
                                                    onClick={() =>
                                                        setShowQueryBuilder(
                                                            (prev) => !prev,
                                                        )
                                                    }
                                                    size="small"
                                                    color={
                                                        showQueryBuilder
                                                            ? "primary"
                                                            : "default"
                                                    }
                                                >
                                                    <FilterAltIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />

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
                                defaultValues={agileBoard}
                            />
                        </Box>
                    ) : null}
                </Box>
                <Box sx={{ width: "100%" }}>
                    {mode === "board" ? (
                        <AgileBoard
                            boardData={agileBoard}
                            query={debouncedSearch}
                            onCardDoubleClick={handleCardDoubleClick}
                        />
                    ) : (
                        <Box px={4}>
                            <BoardViewList
                                boardData={agileBoard}
                                query={debouncedSearch}
                            />
                        </Box>
                    )}
                </Box>
                <DeleteAgileBoardDialog
                    id={agileBoard.id}
                    open={deleteDialogOpen}
                    onClose={() => setDeleteDialogOpen(false)}
                />
            </Stack>

            {showQueryBuilder && (
                <>
                    <Box
                        id="queryBuilderResizer"
                        component={PanelResizeHandle}
                        order={9}
                    >
                        <Divider orientation="vertical" />
                    </Box>

                    <Box
                        id="queryBuilder"
                        order={10}
                        component={Panel}
                        defaultSize={20}
                        minSize={15}
                    >
                        <QueryBuilder
                            onChangeQuery={setSearch}
                            initialQuery={searchQuery}
                        />
                    </Box>
                </>
            )}
        </Box>
    );
};

export { AgileBoardView };
