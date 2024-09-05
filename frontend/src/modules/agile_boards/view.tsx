import DeleteIcon from "@mui/icons-material/Delete";
import {
    Box,
    Breadcrumbs,
    Container,
    IconButton,
    Typography,
} from "@mui/material";
import { getRouteApi } from "@tanstack/react-router";
import { Link } from "components";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { agileBoardApi } from "store";
import { UpdateAgileBoardT } from "types";
import { formatErrorMessages, toastApiError } from "utils";
import { AgileBoardForm } from "./components/agile_board_form";
import { DeleteAgileBoardDialog } from "./components/delete_dialog";

const routeApi = getRouteApi("/_authenticated/agiles/$boardId");

const AgileBoardView = () => {
    const { t } = useTranslation();
    const { boardId } = routeApi.useParams();

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const { data, error } = agileBoardApi.useGetAgileBoardQuery(boardId);

    const [updateAgileBoard, { isLoading }] =
        agileBoardApi.useUpdateAgileBoardMutation();

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

    if (!data) return null;

    const agileBoard = data.payload;

    const onSubmit = (formData: UpdateAgileBoardT) => {
        updateAgileBoard({
            id: agileBoard.id,
            ...formData,
        })
            .unwrap()
            .then(() => {
                toast.success(t("agileBoards.update.success"));
            })
            .catch(toastApiError);
    };

    return (
        <Container sx={{ px: 4, pb: 4 }} disableGutters>
            <DeleteAgileBoardDialog
                id={agileBoard.id}
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            />

            <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Breadcrumbs>
                    <Link to="/custom-fields" underline="hover">
                        <Typography fontSize={24} fontWeight="bold">
                            {t("agileBoards.title")}
                        </Typography>
                    </Link>
                    <Typography fontSize={24} fontWeight="bold">
                        {agileBoard.name}
                    </Typography>
                </Breadcrumbs>

                <IconButton
                    onClick={() => setDeleteDialogOpen(true)}
                    color="error"
                    size="small"
                >
                    <DeleteIcon />
                </IconButton>
            </Box>

            <AgileBoardForm
                onSubmit={onSubmit}
                defaultValues={agileBoard}
                loading={isLoading}
            />
        </Container>
    );
};

export { AgileBoardView };
