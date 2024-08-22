import { yupResolver } from "@hookform/resolvers/yup";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import { Link } from "@tanstack/react-router";
import { FC } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { customFieldsTypes, CustomFieldT } from "types";
import * as yup from "yup";

const customFieldSchema = yup.object().shape({
    name: yup.string().required("form.validation.required"),
    type: yup
        .string()
        .oneOf(customFieldsTypes)
        .required("form.validation.required"),
    is_nullable: yup.boolean().required("form.validation.required"),
});

type CustomFieldFormData = yup.InferType<typeof customFieldSchema>;

interface ICustomFieldFormProps {
    defaultValues?: CustomFieldT;
    onSubmit: (formData: CustomFieldFormData) => void;
    loading?: boolean;
}

const CustomFieldForm: FC<ICustomFieldFormProps> = ({
    defaultValues,
    onSubmit,
    loading,
}) => {
    const { t } = useTranslation();

    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            name: defaultValues?.name || "",
            type: defaultValues?.type || "string",
            is_nullable: defaultValues?.is_nullable || false,
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
        >
            <Typography fontSize={20} fontWeight="bold" lineHeight={1.8}>
                {t("customFields.form.title")}
            </Typography>

            <TextField
                {...register("name")}
                label={t("customFields.form.name")}
                error={!!errors.name}
                helperText={t(errors.name?.message || "")}
                variant="outlined"
                size="small"
                required
                fullWidth
            />

            <FormControl>
                <InputLabel id="type" error={!!errors.type}>
                    {t("customFields.form.type")}
                </InputLabel>
                <Controller
                    name="type"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                        <Select
                            value={value}
                            labelId="type"
                            label={t("customFields.form.type")}
                            onChange={onChange}
                            error={!!errors.type}
                            size="small"
                        >
                            {customFieldsTypes.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {t(`customFields.types.${type}`)}
                                </MenuItem>
                            ))}
                        </Select>
                    )}
                />
                {!!errors.type && (
                    <FormHelperText error>
                        {t(errors.type?.message || "")}
                    </FormHelperText>
                )}
            </FormControl>

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
                >
                    {t("save")}
                </LoadingButton>

                <Link to="..">
                    <Button variant="outlined" color="error">
                        {t("cancel")}
                    </Button>
                </Link>
            </Box>
        </Box>
    );
};

export { CustomFieldForm };
