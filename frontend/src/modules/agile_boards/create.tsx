import { Breadcrumbs, Container, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { Link } from "components";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { agileBoardApi } from "store";
import { CreateAgileBoardT } from "types";
import { toastApiError } from "utils";
import { AgileBoardForm } from "./components/agile_board_form";

const AgileBoardCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [createAgileBoard, { isLoading }] =
        agileBoardApi.useCreateAgileBoardMutation();

    const onSubmit = (formData: CreateAgileBoardT) => {
        createAgileBoard(formData)
            .unwrap()
            .then(() => {
                navigate({
                    to: "/agiles",
                });
                toast.success(t("agileBoards.create.success"));
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

            <AgileBoardForm onSubmit={onSubmit} loading={isLoading} />
        </Container>
    );
};

export { AgileBoardCreate };
