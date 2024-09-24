import { Container, Typography } from "@mui/material";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { formatErrorMessages } from "utils";
import { NotFound } from "./not_found";

const ErrorHandler: FC<{ error: any; message?: string }> = ({
    error,
    message = "error.default",
}) => {
    const { t } = useTranslation();

    if ("status" in error && [403, 404].includes(error.status)) {
        return <NotFound />;
    }

    return (
        <Container sx={{ px: 4, pb: 4 }} disableGutters>
            <Typography fontSize={20} fontWeight="bold">
                {formatErrorMessages(error) || t(message)}
            </Typography>
        </Container>
    );
};

export { ErrorHandler };
