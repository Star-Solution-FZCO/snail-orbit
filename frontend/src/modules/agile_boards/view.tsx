import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SettingsIcon from "@mui/icons-material/Settings";
import {
    Box,
    Container,
    IconButton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { agileBoardApi } from "store";
import { formatErrorMessages, toastApiError } from "utils";
import { Link, NavbarActionButton, useNavbarSettings } from "../../components";
import { AgileBoardT } from "../../types";
import { AgileBoard } from "./components/agile_board";
import { AgileBoardForm } from "./components/agile_board_form/agile_board_form";
import type { AgileBoardFormData } from "./components/agile_board_form/agile_board_form.schema";
import { AgileBoardSelect } from "./components/agile_board_select";
import { DeleteAgileBoardDialog } from "./components/delete_dialog";
import { agileBoardToFormValues } from "./utils/agileBoardToFormValues";
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

    const agileBoard = useMemo(() => data?.payload, [data]);

    const formValues = useMemo(
        () => (agileBoard ? agileBoardToFormValues(agileBoard) : undefined),
        [agileBoard],
    );

    useEffect(() => {
        setAction(
            <Link to="/agiles/create">
                <NavbarActionButton startIcon={<AddIcon />}>
                    {t("agileBoards.new")}
                </NavbarActionButton>
            </Link>,
        );

        return () => setAction(null);
    }, [setAction]);

    if (error) {
        return (
            <Container sx={{ px: 4, pb: 4 }} disableGutters>
                <Typography fontSize={24} fontWeight="bold">
                    {formatErrorMessages(error) ||
                        t("agileBoards.item.fetch.error")}
                </Typography>
            </Container>
        );
    }

    useEffect(() => {
        setLastViewBoardId(boardId);
    }, []);

    const handleBoardSelect = useCallback(
        (board: AgileBoardT) => {
            navigate({ to: "/agiles/$boardId", params: { boardId: board.id } });
        },
        [navigate],
    );

    if (!agileBoard) return null;

    const onSubmit = (formData: AgileBoardFormData) => {
        updateAgileBoard({
            id: agileBoard.id,
            ...formValuesToCreateForm(formData),
        })
            .unwrap()
            .then(() => {
                toast.success(t("agileBoards.update.success"));
            })
            .catch(toastApiError);
    };

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
                                size="small"
                            >
                                <DeleteIcon />
                            </IconButton>
                        )}

                        <IconButton
                            onClick={() => setSettingsOpen((prev) => !prev)}
                            color="primary"
                            size="small"
                        >
                            <SettingsIcon />
                        </IconButton>
                    </Stack>
                </Stack>

                {settingsOpen && formValues ? (
                    <Box mb={2}>
                        <AgileBoardForm
                            onSubmit={onSubmit}
                            defaultValues={formValues}
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
