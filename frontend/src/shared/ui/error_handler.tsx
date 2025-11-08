import { Container, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatErrorMessages } from "shared/utils";
import { NotFound } from "./not_found";

type ErrorHandlerProps = {
    error: unknown;
    message?: ReactNode;
    action?: ReactNode;
};

const ErrorHandler = (props: ErrorHandlerProps) => {
    const { error, message, action } = props;
    const { t } = useTranslation();

    if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        [403, 404].includes(error.status as number)
    ) {
        return <NotFound />;
    }

    return (
        <Container
            sx={{
                p: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "6px",
            }}
            disableGutters
        >
            <Typography fontSize={20} fontWeight="bold">
                {formatErrorMessages(error) || message || t("error.default")}
            </Typography>
            {action}
        </Container>
    );
};

export { ErrorHandler };
