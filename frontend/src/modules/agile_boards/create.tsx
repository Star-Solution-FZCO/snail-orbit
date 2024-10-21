import { Breadcrumbs, Container, Typography } from "@mui/material";
import { Link } from "components";
import { useTranslation } from "react-i18next";

const AgileBoardCreate = () => {
    const { t } = useTranslation();
    // const navigate = useNavigate();
    //
    // const [createAgileBoard] =
    //     agileBoardApi.useCreateAgileBoardMutation();

    // const onSubmit = (formData: AgileBoardFormData) => {
    //     createAgileBoard(formValuesToCreateForm(formData))
    //         .unwrap()
    //         .then((response) => {
    //             toast.success(t("agileBoards.create.success"));
    //             navigate({
    //                 to: `/agiles/${response.payload.id}`,
    //             });
    //         })
    //         .catch(toastApiError);
    // };

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

            {/*<AgileBoardForm onSubmit={onSubmit} />*/}
        </Container>
    );
};

export { AgileBoardCreate };
