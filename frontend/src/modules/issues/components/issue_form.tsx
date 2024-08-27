import { yupResolver } from "@hookform/resolvers/yup";
import { LoadingButton } from "@mui/lab";
import { Box, Button, Stack, TextField } from "@mui/material";
import { skipToken } from "@reduxjs/toolkit/query";
import { Link } from "@tanstack/react-router";
import { MDEditor } from "components";
import { FC } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { projectApi } from "store";
import { CreateIssueT } from "types";
import * as yup from "yup";
import { CustomFieldsParser } from "./CustomFieldsParser";
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
    hideCancel?: boolean;
};

export const IssueForm: FC<IssueFormProps> = ({
    defaultValues,
    onSubmit,
    loading,
    hideCancel,
}) => {
    const { t } = useTranslation();

    const form = useForm<IssueFormData>({
        defaultValues,
        resolver: yupResolver(issueSchema),
    });

    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = form;

    const { data: projectData } = projectApi.useGetProjectQuery(
        watch("project_id") ?? skipToken,
    );

    return (
        <FormProvider {...form}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Stack direction="row" gap={3} sx={{ width: 1 }}>
                    <Stack direction="column" gap={2} sx={{ width: 1 }}>
                        <TextField
                            {...register("subject")}
                            label={t("issues.form.subject")}
                            error={!!errors.subject}
                            helperText={t(errors.subject?.message || "")}
                            variant="outlined"
                            size="small"
                            fullWidth
                        />

                        <Box>
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
                        </Box>

                        <Box display="flex" gap={1}>
                            <LoadingButton
                                type="submit"
                                variant="outlined"
                                size="small"
                                loading={loading}
                            >
                                {t("save")}
                            </LoadingButton>

                            {!hideCancel && (
                                <Link to="..">
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        size="small"
                                    >
                                        {t("cancel")}
                                    </Button>
                                </Link>
                            )}
                        </Box>
                    </Stack>

                    <FieldContainer>
                        <Controller
                            control={control}
                            name="project_id"
                            render={({ field }) => (
                                <ProjectField
                                    {...field}
                                    label={t("issues.form.project.label")}
                                />
                            )}
                        />
                        <CustomFieldsParser
                            fields={projectData?.payload.custom_fields || []}
                        />
                    </FieldContainer>
                </Stack>
            </form>
        </FormProvider>
    );
};

export default IssueForm;
