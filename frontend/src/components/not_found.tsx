import { Box, Typography } from "@mui/material";
import { Navigate } from "@tanstack/react-router";
import PageNotFoundImagePath from "assets/images/page_not_found.png";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "store";
import { Link } from "./link";

const NotFound = () => {
    const { t } = useTranslation();

    const { user } = useAppSelector((state) => state.profile);

    if (!user) {
        return <Navigate to="/login" />;
    }

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            p={4}
            gap={4}
            sx={{
                "& img": {
                    maxWidth: 400,
                },
            }}
        >
            <img src={PageNotFoundImagePath} alt="page-not-found" />

            <Box maxWidth="400px">
                <Typography variant="h3">{t("pageNotFound")}</Typography>

                <Typography my={3}>{t("pageNotFound.description")}</Typography>

                <Typography>
                    <Link to="/issues">{t("navbar.issues")}</Link>
                    {", "}
                    <Link to="/agiles">{t("navbar.agileBoards")}</Link>
                </Typography>
            </Box>
        </Box>
    );
};

export { NotFound };
