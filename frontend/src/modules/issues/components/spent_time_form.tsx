import CloseIcon from "@mui/icons-material/Close";
import { LoadingButton } from "@mui/lab";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
} from "@mui/material";
import { FC } from "react";
import { useTranslation } from "react-i18next";

interface ISpentTimeFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: () => void;
    loading?: boolean;
}

const SpentTimeForm: FC<ISpentTimeFormProps> = ({
    open,
    onClose,
    onSubmit,
    loading,
}) => {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 1,
                }}
            >
                {t("issues.spentTime.add")}

                <IconButton onClick={onClose} size="small" disabled={loading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent></DialogContent>

            <DialogActions>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="error"
                    disabled={loading}
                >
                    {t("cancel")}
                </Button>

                <LoadingButton
                    onClick={onSubmit}
                    variant="outlined"
                    loading={loading}
                >
                    {t("save")}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

export { SpentTimeForm };
