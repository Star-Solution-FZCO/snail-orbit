import { yupResolver } from "@hookform/resolvers/yup";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import {
    Box,
    Button,
    Checkbox,
    Collapse,
    FormControlLabel,
    Link as MuiLink,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { useEffect, useState, type FC } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type {
    CustomFieldT,
    CustomFieldTypeT,
    CustomFieldValueT,
} from "shared/model/types";
import { Link } from "shared/ui";
import * as yup from "yup";
import { DefaultValueInput } from "./default_value_input";

const customFieldSchema = yup.object().shape({
    label: yup.string().required("form.validation.required"),
    is_nullable: yup.boolean().required("form.validation.required"),
    default_value: yup.mixed().notRequired(),
});

type CustomFieldFormData = yup.InferType<typeof customFieldSchema>;

interface ICustomFieldFormProps {
    defaultValues?: CustomFieldT;
    onSubmit: (formData: CustomFieldFormData) => void;
    onDelete?: () => void;
    onCancel?: () => void;
    onCopy?: () => void;
    onEdit?: () => void;
    type: CustomFieldTypeT;
    loading?: boolean;
    disabled?: boolean;
}

const CustomFieldForm: FC<ICustomFieldFormProps> = ({
    defaultValues,
    onSubmit,
    onDelete,
    onCancel,
    onCopy,
    onEdit,
    type,
    loading,
    disabled,
}) => {
    const { t } = useTranslation();

    const [usedInExpanded, setUsedInExpanded] = useState(true);

    const {
        control,
        register,
        handleSubmit,
        formState: { errors, isDirty },
        reset,
    } = useForm({
        defaultValues: {
            label: defaultValues?.label || "",
            is_nullable: defaultValues?.is_nullable || false,
            default_value: defaultValues?.default_value,
        },
        resolver: yupResolver(customFieldSchema),
    });

    useEffect(() => {
        reset({
            label: defaultValues?.label || "",
            is_nullable: defaultValues?.is_nullable || false,
            default_value: defaultValues?.default_value,
        });
    }, [defaultValues, reset]);

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
                disabled={disabled}
            />

            <Controller
                name="default_value"
                control={control}
                render={({ field: { value, onChange } }) => (
                    <DefaultValueInput
                        value={value as CustomFieldValueT}
                        options={
                            defaultValues && "options" in defaultValues
                                ? defaultValues.options
                                : []
                        }
                        type={type}
                        onChange={onChange}
                        error={!!errors?.default_value}
                        errorMessage={errors.default_value?.message as string}
                        disabled={disabled}
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
                                disabled={disabled}
                            />
                        }
                    />
                )}
            />

            <Box display="flex" gap={1}>
                {disabled && onEdit ? (
                    <Button onClick={onEdit} variant="outlined" size="small">
                        {t("customFields.form.edit")}
                    </Button>
                ) : (
                    <Button
                        type="submit"
                        variant="outlined"
                        size="small"
                        loading={loading}
                        disabled={!isDirty || disabled}
                    >
                        {t("save")}
                    </Button>
                )}

                {onCancel && (
                    <Button
                        onClick={onCancel}
                        variant="outlined"
                        color="error"
                        size="small"
                    >
                        {t("cancel")}
                    </Button>
                )}

                {onCopy && (
                    <Button
                        onClick={onCopy}
                        startIcon={<ContentCopyIcon />}
                        variant="outlined"
                        color="info"
                        size="small"
                    >
                        {t("copy")}
                    </Button>
                )}

                {onDelete && (
                    <Button
                        onClick={onDelete}
                        startIcon={<DeleteIcon />}
                        variant="outlined"
                        color="error"
                        size="small"
                    >
                        {t("delete")}
                    </Button>
                )}
            </Box>

            {defaultValues && defaultValues.projects.length > 0 && (
                <Stack fontSize={14}>
                    <MuiLink
                        sx={{ cursor: "pointer" }}
                        onClick={() => setUsedInExpanded(!usedInExpanded)}
                        display="flex"
                        alignItems="center"
                        gap={0.5}
                        underline="hover"
                        fontSize="inherit"
                    >
                        <ArrowForwardIosIcon
                            sx={{
                                transform: usedInExpanded
                                    ? "rotate(90deg)"
                                    : "none",
                                transition: "transform 0.2s",
                            }}
                            fontSize="inherit"
                        />

                        <Typography fontSize="inherit">
                            {t("customFields.fields.usedInProjects")}
                        </Typography>
                    </MuiLink>

                    <Collapse in={usedInExpanded}>
                        <Stack direction="row" flexWrap="wrap" mt={1}>
                            {defaultValues.projects.map((project) => (
                                <Link
                                    key={`project-${project.id}`}
                                    to="/projects/$projectId"
                                    params={{ projectId: project.slug }}
                                    search={{
                                        // @ts-expect-error TODO: fix this types
                                        tab: "customFields",
                                    }}
                                    underline="hover"
                                    fontSize="inherit"
                                    mr={2}
                                >
                                    {project.name}
                                </Link>
                            ))}
                        </Stack>
                    </Collapse>
                </Stack>
            )}
        </Box>
    );
};

export { CustomFieldForm };
