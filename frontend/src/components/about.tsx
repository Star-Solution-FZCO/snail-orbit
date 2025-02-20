import {
    Box,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Typography,
} from "@mui/material";
import { skipToken } from "@reduxjs/toolkit/query";
import { appVersion } from "config";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { sharedApi } from "store";

type AboutProps = {
    open: boolean;
    onClose: () => void;
};

const About = memo((props: AboutProps) => {
    const { t } = useTranslation();
    const { open, onClose } = props;

    const { data: backendVersionData, isLoading: backendVersionIsLoading } =
        sharedApi.useGetVersionQuery(!open ? skipToken : undefined);

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>
                <Typography>{t("about.title")}</Typography>
            </DialogTitle>
            <DialogContent>
                <Box display="flex" flexDirection="column">
                    <Typography>
                        {t("about.frontendVersion")}: {appVersion}
                    </Typography>
                    <Typography>
                        {t("about.backendVersion")}:{" "}
                        {backendVersionIsLoading ? (
                            <CircularProgress size={16} />
                        ) : (
                            backendVersionData?.payload?.version
                        )}
                    </Typography>
                </Box>
            </DialogContent>
        </Dialog>
    );
});

About.displayName = "About";

export { About };
