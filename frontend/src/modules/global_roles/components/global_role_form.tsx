import { LoadingButton } from "@mui/lab";
import { Box, Stack, TextField } from "@mui/material";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type {
    CreateGlobalRoleT,
    GlobalRoleT,
    UpdateGlobalRoleT,
} from "shared/model/types";

interface IGlobalRoleFormProps {
    role?: GlobalRoleT;
    onSubmit: (
        data: CreateGlobalRoleT | UpdateGlobalRoleT,
    ) => void | Promise<void>;
    isSubmitting?: boolean;
    submitText?: string;
}

const GlobalRoleForm: FC<IGlobalRoleFormProps> = ({
    role,
    onSubmit,
    isSubmitting = false,
    submitText,
}) => {
    const { t } = useTranslation();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateGlobalRoleT>({
        defaultValues: {
            name: role?.name || "",
            description: role?.description || null,
        },
    });

    const onFormSubmit = async (data: CreateGlobalRoleT) => {
        await onSubmit(data);
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onFormSubmit)}>
            <Stack gap={2}>
                <TextField
                    label={t("global-roles.fields.name")}
                    {...register("name", {
                        required: t("global-roles.validation.name.required"),
                    })}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    fullWidth
                />

                <TextField
                    label={t("description")}
                    {...register("description")}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    multiline
                    rows={3}
                    fullWidth
                />

                <LoadingButton
                    type="submit"
                    variant="contained"
                    loading={isSubmitting}
                    sx={{ alignSelf: "flex-start" }}
                >
                    {submitText || t("save")}
                </LoadingButton>
            </Stack>
        </Box>
    );
};

export { GlobalRoleForm };
