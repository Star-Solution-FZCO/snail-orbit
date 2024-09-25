import DeleteIcon from "@mui/icons-material/Delete";
import {
    Box,
    Breadcrumbs,
    Container,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import { getRouteApi } from "@tanstack/react-router";
import { Link } from "components";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { agileBoardApi } from "store";
import { formatErrorMessages, toastApiError } from "utils";
import { AgileBoard } from "./components/agile_board";
import { AgileBoardForm } from "./components/agile_board_form/agile_board_form";
import { AgileBoardFormData } from "./components/agile_board_form/agile_board_form.schema";
import { DeleteAgileBoardDialog } from "./components/delete_dialog";
import { agileBoardToFormValues } from "./utils/agileBoardToFormValues";
import { formValuesToCreateForm } from "./utils/formValuesToCreateForm";

const routeApi = getRouteApi("/_authenticated/agiles/$boardId");

const AgileBoardView = () => {
    const { t } = useTranslation();
    const { boardId } = routeApi.useParams();

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const { data, error, refetch } =
        agileBoardApi.useGetAgileBoardQuery(boardId);

    useEffect(() => {
        console.log(data?.payload);
    }, [data?.payload]);

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

    const onSubmit = (formData: AgileBoardFormData) => {
        updateAgileBoard({
            id: agileBoard.id,
            ...formValuesToCreateForm(formData),
        })
            .unwrap()
            .then(() => {
                toast.success(t("agileBoards.update.success"));
                refetch();
            })
            .catch(toastApiError);
    };

    return (
        <Stack direction="column">
            <Container sx={{ pb: 4, px: 4 }} disableGutters>
                <DeleteAgileBoardDialog
                    id={agileBoard.id}
                    open={deleteDialogOpen}
                    onClose={() => setDeleteDialogOpen(false)}
                />

                <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Breadcrumbs>
                        <Link to="/agiles" underline="hover">
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
                    defaultValues={agileBoardToFormValues(agileBoard)}
                    loading={isLoading}
                />
            </Container>
            <Box sx={{ width: "100dvw" }}>
                <AgileBoard boardData={agileBoard} />
            </Box>
        </Stack>
    );
};

export { AgileBoardView };
