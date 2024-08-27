import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Breadcrumbs, IconButton, Typography } from "@mui/material";
import { getRouteApi } from "@tanstack/react-router";
import { Link } from "components";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { agileBoardApi } from "store";
import { UpdateAgileBoardT } from "types";
import { toastApiError } from "utils";
import { AgileBoardForm } from "./components/agile_board_form";
import { DeleteAgileBoardDialog } from "./components/delete_dialog";

const routeApi = getRouteApi("/_authenticated/agiles/$boardId");

const AgileBoardView = () => {
    const { t } = useTranslation();
    const { boardId } = routeApi.useParams();

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const { data } = agileBoardApi.useGetAgileBoardQuery(boardId);

    const [updateAgileBoard, { isLoading }] =
        agileBoardApi.useUpdateAgileBoardMutation();

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
        <Box display="flex" flexDirection="column" px={4} gap={2}>
            <DeleteAgileBoardDialog
                id={agileBoard.id}
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            />

            <Box display="flex" alignItems="center" gap={1}>
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
        </Box>
    );
};

export { AgileBoardView };
