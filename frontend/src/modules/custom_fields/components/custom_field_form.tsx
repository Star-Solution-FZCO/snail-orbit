import { yupResolver } from "@hookform/resolvers/yup";
import DeleteIcon from "@mui/icons-material/Delete";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    TextField,
} from "@mui/material";
import { type FC } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { CustomFieldT, CustomFieldTypeT } from "types";
import * as yup from "yup";
import { DefaultValueInput } from "./default_value_input";

const customFieldSchema = yup.object().shape({
    label: yup.string().required("form.validation.required"),
    is_nullable: yup.boolean().required("form.validation.required"),
    default_value: yup
        .mixed()
        .required("form.validation.required")
        .nullable()
        .default(null),
});

type CustomFieldFormData = yup.InferType<typeof customFieldSchema>;

interface ICustomFieldFormProps {
    defaultValues?: CustomFieldT;
    onSubmit: (formData: CustomFieldFormData) => void;
    onDelete?: () => void;
    type: CustomFieldTypeT;
    loading?: boolean;
}

const CustomFieldForm: FC<ICustomFieldFormProps> = ({
    defaultValues,
    onSubmit,
    onDelete,
    type,
    loading,
}) => {
    const { t } = useTranslation();

    const {
        control,
        register,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm({
        defaultValues: {
            label: defaultValues?.label || "",
            is_nullable: defaultValues?.is_nullable || false,
            default_value: defaultValues?.default_value,
        },
        resolver: yupResolver(customFieldSchema),
    });

    return (
        <Box
            component="form"
            display="flex"
            flexDirection="column"
            gap={1}
            onSubmit={handleSubmit(onSubmit)}
            maxWidth="sm"
        >
            <TextField
                {...register("label")}
                label={t("customFields.form.label")}
                error={!!errors.label}
                helperText={t(errors.label?.message || "")}
                variant="outlined"
                size="small"
                fullWidth
            />

            <Controller
                name="default_value"
                control={control}
                render={({ field: { value, onChange } }) => (
                    <DefaultValueInput
                        value={value}
                        options={defaultValues?.options}
                        type={type}
                        onChange={onChange}
                        error={!!errors?.default_value}
                        errorMessage={errors.default_value?.message as string}
                    />
                )}
            />

            <Controller
                name="is_nullable"
                control={control}
                render={({ field: { value, onChange } }) => (
                    <FormControlLabel
                        label={t("customFields.form.nullable")}
                        control={
                            <Checkbox
                                checked={value}
                                onChange={(_, checked) => onChange(checked)}
                                size="small"
                            />
                        }
                    />
                )}
            />

            <Box display="flex" gap={1}>
                <LoadingButton
                    type="submit"
                    variant="outlined"
                    loading={loading}
                    disabled={!isDirty}
                >
                    {t("save")}
                </LoadingButton>

                {onDelete && (
                    <Button
                        onClick={onDelete}
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                    >
                        {t("delete")}
                    </Button>
                )}
            </Box>
        </Box>
    );
};

export { CustomFieldForm };
