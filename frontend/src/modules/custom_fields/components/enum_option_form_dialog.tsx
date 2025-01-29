import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from "@mui/material";
import type { FC } from "react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { EnumOptionT } from "types";
import * as yup from "yup";
import { ColorInputField } from "../../../components/color_picker/color_input_field";

const enumOptionSchema = yup.object().shape({
    value: yup.string().required("form.validation.required"),
    color: yup.string().nullable().default(null),
});

type EnumOptionFormData = yup.InferType<typeof enumOptionSchema>;

interface IEnumOptionFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: EnumOptionFormData) => void;
    defaultValues?: EnumOptionT | null;
    loading?: boolean;
}

const EnumOptionFormDialog: FC<IEnumOptionFormDialogProps> = ({
    open,
    onClose,
    onSubmit,
    defaultValues,
    loading,
}) => {
    const { t } = useTranslation();

    const {
        control,
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm({ defaultValues: defaultValues || { value: "", color: null } });

    useEffect(() => {
        reset(defaultValues || { value: "", color: null });
    }, [open, defaultValues, reset]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                {t(
                    defaultValues
                        ? "customFields.options.edit"
                        : "customFields.options.new",
                )}
            </DialogTitle>

            <DialogContent>
                <Box display="flex" flexDirection="column" gap={1} mt={1}>
                    <TextField
                        {...register("value")}
                        label={t("customFields.options.value")}
                        error={!!errors.value}
                        helperText={t(errors.value?.message || "")}
                        variant="outlined"
                        size="small"
                        fullWidth
                    />

                    <Controller
                        name="color"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <ColorInputField
                                color={value || ""}
                                onChange={onChange}
                                size="small"
                                label={t("customFields.options.color")}
                            />
                        )}
                    />
                </Box>
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="error"
                    size="small"
                >
                    {t("cancel")}
                </Button>

                <LoadingButton
                    onClick={handleSubmit(onSubmit)}
                    variant="outlined"
                    size="small"
                    loading={loading}
                    disabled={!isDirty}
                >
                    {t("save")}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

export { EnumOptionFormDialog };
