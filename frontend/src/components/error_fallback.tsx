import { Box, Typography } from "@mui/material";
import CatsNoConnectionImagePath from "assets/images/cats_no_connection.png";
import { useTranslation } from "react-i18next";
import { Link } from "./link";

const ErrorFallback = () => {
    const { t } = useTranslation();

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
            <img src={CatsNoConnectionImagePath} alt="something-went-wrong" />

            <Box>
                <Typography variant="h3">{t("somethingWentWrong")}</Typography>

                <Typography my={3} maxWidth="400px">
                    {t("somethingWentWrong.description")}
                </Typography>

                <Link to="/">{t("mainPage")}</Link>
            </Box>
        </Box>
    );
};

export { ErrorFallback };
