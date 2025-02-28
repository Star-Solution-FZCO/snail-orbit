import { LoadingButton } from "@mui/lab";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    Stack,
    TextField,
} from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { CreateSearchT } from "types/search";

export type EditSearchDialogValues = CreateSearchT;

type EditSearchDialogProps = {
    open: boolean;
    onSubmit: (data: EditSearchDialogValues) => unknown;
    onClose?: () => unknown;
    onDelete?: (data: EditSearchDialogValues) => unknown;
    loading?: boolean;
    defaultValues?: EditSearchDialogValues;
};

export const EditSearchDialog = (props: EditSearchDialogProps) => {
    const { open, onClose, loading, defaultValues, onSubmit, onDelete } = props;

    const { t } = useTranslation();

    const { register, handleSubmit, reset } = useForm<EditSearchDialogValues>({
        defaultValues,
    });

    useEffect(() => {
        reset(defaultValues);
    }, [defaultValues]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            disableRestoreFocus
        >
            <DialogContent>
                <Stack direction="column" gap={2}>
                    <TextField
                        {...register("name")}
                        fullWidth
                        size="small"
                        label={t("editSearchDialog.label.name")}
                        autoFocus
                    />
                    <TextField
                        {...register("description")}
                        fullWidth
                        size="small"
                        label={t("editSearchDialog.label.description")}
                    />
                    <TextField
                        {...register("query")}
                        fullWidth
                        size="small"
                        label={t("editSearchDialog.label.query")}
                    />
                </Stack>
            </DialogContent>
            <DialogActions
                sx={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    flexDirection: "row",
                }}
            >
                <div>
                    {defaultValues?.id ? (
                        <Button
                            color="error"
                            onClick={() => onDelete?.(defaultValues)}
                        >
                            {t("delete")}
                        </Button>
                    ) : null}
                </div>
                <Stack direction="row" gap={1}>
                    <Button type="button" variant="text" onClick={onClose}>
                        {t("cancel")}
                    </Button>
                    <LoadingButton
                        type="submit"
                        variant="contained"
                        loading={loading}
                        disabled={loading}
                    >
                        {t("create")}
                    </LoadingButton>
                </Stack>
            </DialogActions>
        </Dialog>
    );
};
