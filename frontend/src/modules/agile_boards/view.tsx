import DeleteIcon from "@mui/icons-material/Delete";
import SettingsIcon from "@mui/icons-material/Settings";
import {
    Box,
    Button,
    Container,
    IconButton,
    Menu,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { Link, NavbarActionButton, useNavbarSettings } from "components";
import PopupState, { bindMenu, bindTrigger } from "material-ui-popup-state";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { agileBoardApi } from "store";
import { AgileBoardT } from "types";
import { formatErrorMessages, toastApiError } from "utils";
import { StarButton } from "../../components/star_button";
import { AgileBoard } from "./components/agile_board";
import { AgileBoardForm } from "./components/agile_board_form/agile_board_form";
import { AgileBoardSelect } from "./components/agile_board_select";
import { DeleteAgileBoardDialog } from "./components/delete_dialog";
import { formValuesToCreateForm } from "./utils/formValuesToCreateForm";
import { setLastViewBoardId } from "./utils/lastViewBoardStorage";

const routeApi = getRouteApi("/_authenticated/agiles/$boardId");

const AgileBoardView = () => {
    const { t } = useTranslation();
    const { boardId } = routeApi.useParams();
    const { setAction } = useNavbarSettings();
    const navigate = useNavigate();

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const { data, error } = agileBoardApi.useGetAgileBoardQuery(boardId);

    const [updateAgileBoard] = agileBoardApi.useUpdateAgileBoardMutation();

    const [favoriteAgileBoard] = agileBoardApi.useFavoriteBoardMutation();

    const agileBoard = useMemo(() => data?.payload, [data]);

    useEffect(() => {
        setAction(
            <PopupState popupId="agiles-menu-button" variant="popover">
                {(popupState) => (
                    <>
                        <NavbarActionButton {...bindTrigger(popupState)}>
                            {t("agileBoards.navbarButton")}
                        </NavbarActionButton>
                        <Menu
                            {...bindMenu(popupState)}
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "center",
                            }}
                            transformOrigin={{
                                vertical: "top",
                                horizontal: "center",
                            }}
                        >
                            <Link to="/agiles/create">
                                <MenuItem>{t("agileBoards.new")}</MenuItem>
                            </Link>
                            <Link to="/issues/create">
                                <MenuItem>{t("issues.new")}</MenuItem>
                            </Link>
                        </Menu>
                    </>
                )}
            </PopupState>,
        );

        return () => setAction(null);
    }, [setAction]);

    useEffect(() => {
        setLastViewBoardId(boardId);
    }, []);

    const handleBoardSelect = useCallback(
        (board: AgileBoardT) => {
            navigate({ to: "/agiles/$boardId", params: { boardId: board.id } });
        },
        [navigate],
    );

    const onSubmit = useCallback(
        (formData: AgileBoardT) => {
            if (!agileBoard) return;
            updateAgileBoard({
                id: agileBoard.id,
                ...formValuesToCreateForm(formData),
            })
                .unwrap()
                .then(() => {
                    toast.success(t("agileBoards.update.success"));
                })
                .catch(toastApiError);
        },
        [updateAgileBoard, toast, agileBoard, formValuesToCreateForm],
    );

    const goToFullListHandler = useCallback(() => {
        navigate({ to: "/agiles/list" });
    }, [navigate]);

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
        <Stack direction="column">
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
                        size="small"
                        placeholder={t("placeholder.search")}
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

                        <StarButton
                            starred={agileBoard.is_favorite}
                            onClick={() =>
                                favoriteAgileBoard({
                                    boardId: agileBoard.id,
                                    favorite: !agileBoard.is_favorite,
                                })
                            }
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
                <AgileBoard boardData={agileBoard} />
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
