import { yupResolver } from "@hookform/resolvers/yup";
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
import type { CustomFieldGroupT } from "shared/model/types";
import { customFieldsTypes } from "shared/model/types";
import * as yup from "yup";
import { DefaultValueInput } from "./default_value_input";
import { isComplexCustomFieldType } from "./utils";

const customFieldGroupSchema = yup.object().shape({
    name: yup.string().required("form.validation.required"),
    type: yup
        .string()
        .oneOf(customFieldsTypes)
        .required("form.validation.required"),
    description: yup.string().nullable().default(null),
    ai_description: yup.string().nullable().default(null),
    label: yup.string().default("default"),
    is_nullable: yup.boolean().default(true),
    default_value: yup.mixed().nullable().default(null),
});

type CustomFieldGroupFormData = yup.InferType<typeof customFieldGroupSchema>;

interface ICustomFieldGroupFormProps {
    defaultValues?: CustomFieldGroupT;
    onSubmit: (formData: CustomFieldGroupFormData) => void;
    labelValue?: string;
    loading?: boolean;
}

const CustomFieldGroupForm: FC<ICustomFieldGroupFormProps> = ({
    defaultValues,
    onSubmit,
    labelValue = "default",
    loading,
}) => {
    const { t } = useTranslation();

    const {
        control,
        register,
        watch,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm({
        defaultValues: {
            name: defaultValues?.name || "",
            type: defaultValues?.type || "string",
            description: defaultValues?.description || null,
            ai_description: defaultValues?.ai_description || null,
            label: labelValue,
            is_nullable: false,
        },
        resolver: yupResolver(customFieldGroupSchema),
    });

    const customFieldGroupType = watch("type");

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

            {!defaultValues && (
                <>
                    <TextField
                        {...register("label")}
                        label={t("customFields.form.label")}
                        error={!!errors.label}
                        helperText={t(errors.label?.message || "")}
                        variant="outlined"
                        size="small"
                        disabled={!!defaultValues}
                        fullWidth
                    />

                    {!isComplexCustomFieldType(customFieldGroupType) && (
                        <Controller
                            name="default_value"
                            control={control}
                            render={({ field: { value, onChange } }) => (
                                <DefaultValueInput
                                    // @ts-expect-error TODO: Fix this types
                                    value={value}
                                    type={customFieldGroupType}
                                    onChange={onChange}
                                    error={!!errors?.default_value}
                                    errorMessage={
                                        errors.default_value?.message as string
                                    }
                                />
                            )}
                        />
                    )}

                    <Controller
                        name="is_nullable"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <FormControlLabel
                                label={t("customFields.form.nullable")}
                                control={
                                    <Checkbox
                                        checked={value}
                                        onChange={(_, checked) =>
                                            onChange(checked)
                                        }
                                        size="small"
                                    />
                                }
                            />
                        )}
                    />
                </>
            )}

            <Box display="flex" gap={1}>
                <Button
                    type="submit"
                    variant="outlined"
                    loading={loading}
                    disabled={!isDirty}
                >
                    {t("save")}
                </Button>

                <Link to="..">
                    <Button variant="outlined" color="error">
                        {t("cancel")}
                    </Button>
                </Link>
            </Box>
        </Box>
    );
};

export { CustomFieldGroupForm };
