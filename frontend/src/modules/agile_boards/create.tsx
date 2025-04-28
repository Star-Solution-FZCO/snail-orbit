import AddIcon from "@mui/icons-material/Add";
import { Breadcrumbs, Container, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { agileBoardApi } from "shared/model";
import { Link } from "shared/ui";
import { NavbarActionButton } from "shared/ui/navbar/navbar_action_button";
import { useNavbarSettings } from "shared/ui/navbar/navbar_settings";
import { toastApiError } from "shared/utils";
import { CreateAgileBoardForm } from "./components/create_agile_board_form/create_agile_board_form";
import type { FormValues } from "./components/create_agile_board_form/create_agile_board_form.types";
import { form_values_to_api_data } from "./components/create_agile_board_form/form_values_to_api_data";

const AgileBoardCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { setAction } = useNavbarSettings();

    const [createAgileBoard] = agileBoardApi.useCreateAgileBoardMutation();

    const onSubmit = (formData: FormValues) => {
        createAgileBoard(form_values_to_api_data(formData))
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
