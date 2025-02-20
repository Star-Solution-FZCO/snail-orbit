import AddIcon from "@mui/icons-material/Add";
import { Breadcrumbs, Container, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { Link } from "components";
import { NavbarActionButton } from "components/navbar/navbar_action_button";
import { useNavbarSettings } from "components/navbar/navbar_settings";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { agileBoardApi } from "store";
import { toastApiError } from "utils";
import { CreateAgileBoardForm } from "./components/create_agile_board_form/create_agile_board_form";
import type { CreateAgileBoardFormData } from "./components/create_agile_board_form/create_agile_board_form.schema";
import { formValuesToApiData } from "./components/create_agile_board_form/formValuesToApiData";

const AgileBoardCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { setAction } = useNavbarSettings();

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
