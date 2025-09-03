import { Container, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { CreateAgileBoardForm } from "modules/agile_boards/components/create_agile_board_form/create_agile_board_form";
import type { FormValues } from "modules/agile_boards/components/create_agile_board_form/create_agile_board_form.types";
import { form_values_to_api_data } from "modules/agile_boards/components/create_agile_board_form/form_values_to_api_data";
import { useCreateIssueNavbarSettings } from "modules/issues/hooks/use-create-issue-navbar-settings";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { agileBoardApi } from "shared/model";
import { toastApiError } from "shared/utils";

const AgileBoardCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    useCreateIssueNavbarSettings();

    const [createAgileBoard] = agileBoardApi.useCreateAgileBoardMutation();

    const onSubmit = (formData: FormValues) => {
        createAgileBoard(form_values_to_api_data(formData))
            .unwrap()
            .then((response) => {
                toast.success(t("agileBoards.create.success"));
                navigate({
                    to: `/agiles/$boardId`,
                    params: { boardId: response.payload.id },
                });
            })
            .catch(toastApiError);
    };

    return (
        <Container sx={{ px: 4, pb: 4 }} disableGutters>
            <Typography fontSize={24} fontWeight="bold" mb={1}>
                {t("agileBoards.create.title")}
            </Typography>

            <CreateAgileBoardForm onSubmit={onSubmit} />
        </Container>
    );
};

export { AgileBoardCreate };
