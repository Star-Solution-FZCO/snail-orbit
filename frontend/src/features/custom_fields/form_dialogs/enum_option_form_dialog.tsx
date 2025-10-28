import { yupResolver } from "@hookform/resolvers/yup";
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
import type { EnumOptionT } from "shared/model/types";
import { ColorInputField } from "shared/ui/color_picker/color_input_field";
import * as yup from "yup";

const enumOptionSchema = yup.object().shape({
    value: yup.string().required("form.validation.required"),
    color: yup
        .string()
        .nullable()
        .default(null)
        .matches(
            /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/,
            "form.validation.hexColor",
        ),
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
    } = useForm<EnumOptionFormData>({
        resolver: yupResolver(enumOptionSchema),
        defaultValues: defaultValues || { value: "", color: null },
    });

    useEffect(() => {
        reset(defaultValues || { value: "", color: "#ccc" });
    }, [open, defaultValues, reset]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            onSubmit={handleSubmit(onSubmit)}
            component="form"
        >
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
                        autoFocus
                    />

                    <Controller
                        name="color"
                        control={control}
                        render={({
                            field: { value, onChange },
                            fieldState: { error },
                        }) => (
                            <ColorInputField
                                color={value || ""}
                                onChange={onChange}
                                size="small"
                                label={t("customFields.options.color")}
                                error={!!error}
                                helperText={
                                    error?.message ? t(error.message) : ""
                                }
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

                <Button
                    variant="outlined"
                    size="small"
                    loading={loading}
                    disabled={!isDirty}
                    type="submit"
                >
                    {t("save")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export { EnumOptionFormDialog };
