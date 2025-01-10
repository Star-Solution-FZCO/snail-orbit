import {
    Box,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Typography,
} from "@mui/material";
import { appVersion } from "config";
import { useTranslation } from "react-i18next";
import { closeAbout, sharedApi, useAppDispatch, useAppSelector } from "store";

const About = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();

    const { open } = useAppSelector((state) => state.shared.about);

    const { data: backendVersionData, isLoading: backendVersionIsLoading } =
        sharedApi.useGetVersionQuery();

    const handleClose = () => {
        dispatch(closeAbout());
    };

    return (
        <Dialog open={open} onClose={handleClose}>
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
};

export { About };
