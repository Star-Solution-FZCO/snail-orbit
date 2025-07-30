import CloseIcon from "@mui/icons-material/Close";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    TextField,
} from "@mui/material";
import { FormEvent, useState, type FC } from "react";
import { useTranslation } from "react-i18next";

interface ICopyCustomFieldDialogProps {
    open: boolean;
    onSubmit: (label: string) => void;
    onClose: () => void;
    loading?: boolean;
}

const CopyCustomFieldDialog: FC<ICopyCustomFieldDialogProps> = ({
    open,
    onSubmit,
    onClose,
    loading,
}) => {
    const { t } = useTranslation();

    const [label, setLabel] = useState("");

    const handleSubmit = (e: FormEvent<HTMLDivElement>) => {
        e.preventDefault();
        onSubmit(label);
        setLabel("");
    };

    const handleClose = () => {
        onClose();
        setLabel("");
    };

    return (
        <Dialog
            open={open}
            component="form"
            onSubmit={handleSubmit}
            onClose={handleClose}
        >
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                {t("customFields.copy.title")}

                <IconButton
                    onClick={handleClose}
                    size="small"
                    disabled={loading}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <DialogContentText>
                    {t("customFields.copy.hint")}
                </DialogContentText>

                <TextField
                    sx={{ mt: 1 }}
                    label={t("customFields.form.label")}
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    size="small"
                    fullWidth
                    required
                />
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    color="error"
                    disabled={loading}
                >
                    {t("cancel")}
                </Button>

                <Button
                    type="submit"
                    variant="outlined"
                    disabled={label.length === 0}
                    loading={loading}
                >
                    {t("submit")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export { CopyCustomFieldDialog };
