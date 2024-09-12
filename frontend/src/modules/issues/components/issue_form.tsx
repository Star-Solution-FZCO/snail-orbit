import { yupResolver } from "@hookform/resolvers/yup";
import { LoadingButton } from "@mui/lab";
import { Box, Button, Stack, TextField } from "@mui/material";
import { skipToken } from "@reduxjs/toolkit/query";
import { Link } from "@tanstack/react-router";
import { MDEditor } from "components";
import isEqual from "fast-deep-equal/react";
import { FC, useEffect, useState } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { projectApi } from "store";
import { CreateIssueT } from "types";
import * as yup from "yup";
import { CustomFieldsParser } from "./custom_fields_parser";
import { FieldContainer } from "./field_container";
import { ProjectField } from "./fields/project_field";

const issueSchema = yup.object().shape({
    project_id: yup.string().required("form.validation.required"),
    subject: yup.string().required("form.validation.required"),
    text: yup.string().nullable().default(null),
    fields: yup.object(),
});

export type IssueFormData = yup.InferType<typeof issueSchema>;

type IssueFormProps = {
    defaultValues?: CreateIssueT;
    onSubmit: (formData: IssueFormData) => unknown;
    loading?: boolean;
    hideGoBack?: boolean;
};

export const IssueForm: FC<IssueFormProps> = ({
    defaultValues,
    onSubmit,
    loading,
    hideGoBack,
}) => {
    const { t } = useTranslation();

    const [isDirty, setIsDirty] = useState(false);

    const methods = useForm<IssueFormData>({
        defaultValues,
        resolver: yupResolver(issueSchema),
    });

    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = methods;

    const { data: projectData } = projectApi.useGetProjectQuery(
        watch("project_id") ?? skipToken,
    );

    const watchedValues = useWatch({ control });

    useEffect(() => {
        const isDirty = !isEqual(watchedValues, defaultValues);
        setIsDirty(isDirty);
    }, [watchedValues, defaultValues]);

    return (
        <FormProvider {...methods}>
            <Box
                onSubmit={handleSubmit(onSubmit)}
                component="form"
                display="flex"
                alignItems="flex-start"
                gap={3}
            >
                <Stack direction="column" gap={2} flex={1}>
                    <TextField
                        {...register("subject")}
                        label={t("issues.form.subject")}
                        error={!!errors.subject}
                        helperText={t(errors.subject?.message || "")}
                        variant="outlined"
                        size="small"
                        fullWidth
                    />

                    <Controller
                        name="text"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <MDEditor
                                value={value || ""}
                                onChange={onChange}
                                textareaProps={{
                                    placeholder: t("issues.form.text"),
                                }}
                            />
                        )}
                    />

                    <Box display="flex" gap={1}>
                        <LoadingButton
                            type="submit"
                            variant="outlined"
                            size="small"
                            loading={loading}
                            disabled={!isDirty || loading}
                        >
                            {t("save")}
                        </LoadingButton>

                        {!hideGoBack && (
                            <Link to="/issues">
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                >
                                    {t("back")}
                                </Button>
                            </Link>
                        )}
                    </Box>
                </Stack>

                <FieldContainer>
                    <Controller
                        control={control}
                        name="project_id"
                        render={({ field, formState: { errors } }) => (
                            <ProjectField
                                {...field}
                                label={t("issues.form.project.label")}
                                error={!!errors.project_id}
                            />
                        )}
                    />

                    <CustomFieldsParser
                        fields={projectData?.payload.custom_fields || []}
                    />
                </FieldContainer>
            </Box>
        </FormProvider>
    );
};

export default IssueForm;
