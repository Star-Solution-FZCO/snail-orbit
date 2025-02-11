import { yupResolver } from "@hookform/resolvers/yup";
import DeleteIcon from "@mui/icons-material/Delete";
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
} from "@mui/material";
import { Link } from "@tanstack/react-router";
import { type FC } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { CustomFieldOptionT, CustomFieldT } from "types";
import { customFieldsTypes } from "types";
import * as yup from "yup";

const editableDefaultValueTypes = ["user", "enum", "state"];

const customFieldSchema = yup.object().shape({
    name: yup.string().required("form.validation.required"),
    description: yup.string().nullable().default(null),
    ai_description: yup.string().nullable().default(null),
    type: yup
        .string()
        .oneOf(customFieldsTypes)
        .required("form.validation.required"),
    is_nullable: yup.boolean().required("form.validation.required"),
    default_value: yup
        .mixed()
        .required("form.validation.required")
        .nullable()
        .default(null),
});

type CustomFieldFormData = yup.InferType<typeof customFieldSchema>;

const optionValueGetter = (option: CustomFieldOptionT) => {
    if (typeof option.value === "string") {
        return option.value;
    }

    return option.value.id;
};

const optionLabelGetter = (option: CustomFieldOptionT) => {
    if (typeof option.value === "string") {
        return option.value;
    }

    return option.value.name;
};

const getDefaultValue = (value: unknown) => {
    return typeof value === "object" && value !== null && "id" in value
        ? value.id
        : value;
};

interface ICustomFieldFormProps {
    defaultValues?: CustomFieldT;
    onSubmit: (formData: CustomFieldFormData) => void;
    onDelete?: () => void;
    loading?: boolean;
}

const CustomFieldForm: FC<ICustomFieldFormProps> = ({
    defaultValues,
    onSubmit,
    onDelete,
    loading,
}) => {
    const { t } = useTranslation();

    const {
        control,
        register,
        handleSubmit,
        watch,
        formState: { errors, isDirty },
    } = useForm({
        defaultValues: {
            name: defaultValues?.name || "",
            type: defaultValues?.type || "string",
            description: defaultValues?.description || null,
            ai_description: defaultValues?.ai_description || null,
            is_nullable: defaultValues?.is_nullable || false,
            default_value: defaultValues?.default_value
                ? optionValueGetter(defaultValues?.default_value)
                : null,
        },
        resolver: yupResolver(customFieldSchema),
    });

    const isDefaultValueVisible =
        editableDefaultValueTypes.includes(watch("type")) && !!defaultValues;

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
                {...register("name")}
                label={t("customFields.form.name")}
                error={!!errors.name}
                helperText={t(errors.name?.message || "")}
                variant="outlined"
                size="small"
                fullWidth
            />

            <Controller
                name="type"
                control={control}
                render={({ field: { value, onChange } }) => (
                    <FormControl size="small">
                        <InputLabel id="type" error={!!errors.type}>
                            {t("customFields.form.type")}
                        </InputLabel>
                        <Select
                            value={value}
                            labelId="type"
                            label={t("customFields.form.type")}
                            onChange={onChange}
                            error={!!errors.type}
                            disabled={!!defaultValues}
                            size="small"
                        >
                            {customFieldsTypes.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {t(`customFields.types.${type}`)}
                                </MenuItem>
                            ))}
                        </Select>
                        {!!errors.type && (
                            <FormHelperText error>
                                {t(errors.type?.message || "")}
                            </FormHelperText>
                        )}
                    </FormControl>
                )}
            />

            {isDefaultValueVisible && (
                <Controller
                    name="default_value"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                        <FormControl size="small">
                            <InputLabel id="defaultValue">
                                {t("customFields.form.defaultValue")}
                            </InputLabel>
                            <Select
                                value={getDefaultValue(value)}
                                labelId="defaultValue"
                                label={t("customFields.form.defaultValue")}
                                onChange={onChange}
                                error={!!errors.type}
                                size="small"
                            >
                                <MenuItem key="no_value" value="">
                                    {t("customFields.form.noDefaultValue")}
                                </MenuItem>
                                {defaultValues?.options?.map((option) => (
                                    <MenuItem
                                        key={option.uuid}
                                        value={optionValueGetter(option)}
                                    >
                                        {optionLabelGetter(option)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                />
            )}

            <TextField
                {...register("description")}
                label={t("description")}
                error={!!errors.description}
                helperText={t(errors.description?.message || "")}
                variant="outlined"
                size="small"
                multiline
                rows={6}
                fullWidth
            />

            <TextField
                {...register("ai_description")}
                label={t("customFields.form.aiDescription")}
                error={!!errors.ai_description}
                helperText={t(errors.ai_description?.message || "")}
                variant="outlined"
                size="small"
                multiline
                rows={6}
                fullWidth
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

                <Link to="..">
                    <Button variant="outlined" color="error">
                        {t("cancel")}
                    </Button>
                </Link>

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
