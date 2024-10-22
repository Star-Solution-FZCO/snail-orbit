import { Breadcrumbs, Container, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { Link } from "components";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { agileBoardApi } from "store";
import { toastApiError } from "utils";
import { CreateAgileBoardForm } from "./components/create_agile_board_form/create_agile_board_form";
import { CreateAgileBoardFormData } from "./components/create_agile_board_form/create_agile_board_form.schema";
import { formValuesToApiData } from "./components/create_agile_board_form/formValuesToApiData";

const AgileBoardCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [createAgileBoard] = agileBoardApi.useCreateAgileBoardMutation();

    const onSubmit = (formData: CreateAgileBoardFormData) => {
        createAgileBoard(formValuesToApiData(formData))
            .unwrap()
            .then((response) => {
                toast.success(t("agileBoards.create.success"));
                navigate({
                    to: `/agiles/${response.payload.id}`,
                });
            })
            .catch(toastApiError);
    };

    return (
        <Container sx={{ px: 4, pb: 4 }} disableGutters>
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link to="/agiles" underline="hover">
                    <Typography fontSize={24} fontWeight="bold">
                        {t("agileBoards.title")}
                    </Typography>
                </Link>
                <Typography fontSize={24} fontWeight="bold">
                    {t("agileBoards.create.title")}
                </Typography>
            </Breadcrumbs>

            <CreateAgileBoardForm onSubmit={onSubmit} />
        </Container>
    );
};

export { AgileBoardCreate };
