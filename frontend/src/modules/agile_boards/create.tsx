import { Box, Breadcrumbs, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { Link } from "components";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { agileBoardApi } from "store";
import { CreateAgileBoardT } from "types";
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
            .catch((error) => {
                toast.error(error.data.detail || t("error.default"));
            });
    };

    return (
        <Box display="flex" flexDirection="column" px={4} gap={2}>
            <Breadcrumbs>
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
        </Box>
    );
};

export { AgileBoardCreate };
