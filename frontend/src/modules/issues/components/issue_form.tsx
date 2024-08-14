import { yupResolver } from "@hookform/resolvers/yup";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    FormControl,
    FormHelperText,
    FormLabel,
    MenuItem,
    Select,
    TextField,
} from "@mui/material";
import { Link } from "@tanstack/react-router";
import { MDEditor } from "components";
import { FC } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { CreateIssueT, ProjectT } from "types";
import * as yup from "yup";

const issueSchema = yup.object().shape({
    project_id: yup.string().required("form.validation.required"),
    subject: yup.string().required("form.validation.required"),
    text: yup.string(),
});

export type IssueFormData = yup.InferType<typeof issueSchema>;

type IssueFormProps = {
    defaultValues?: CreateIssueT;
    projects: ProjectT[];
    onSubmit: (formData: IssueFormData) => unknown;
    loading?: boolean;
    hideCancel?: boolean;
};

export const IssueForm: FC<IssueFormProps> = ({
    defaultValues,
    projects, // TODO: Переделать на Custom Field
    onSubmit,
    loading,
    hideCancel,
}) => {
    const { t } = useTranslation();

    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues,
        resolver: yupResolver(issueSchema),
    });

    return (
        <Box
            component="form"
            display="flex"
            flexDirection="column"
            gap={2}
            onSubmit={handleSubmit(onSubmit)}
        >
            <FormControl fullWidth>
                <FormLabel id="issue_project">
                    {t("issue.form.project")}
                </FormLabel>
                <Select
                    {...register("project_id")}
                    error={!!errors.project_id}
                    variant="outlined"
                    size="small"
                    fullWidth
                    labelId="issue_project"
                >
                    {projects.map((project) => (
                        <MenuItem key={project.id} value={project.id}>
                            {project.name}
                        </MenuItem>
                    ))}
                </Select>
                <FormHelperText hidden={!errors.project_id}>
                    {t(errors.project_id?.message || "")}
                </FormHelperText>
            </FormControl>

            <TextField
                {...register("subject")}
                label={t("issue.form.name")}
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
                            value={value}
                            onChange={onChange}
                            textareaProps={{
                                placeholder: t("issue.form.text"),
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
                    {t("issue.form.save")}
                </LoadingButton>

                {!hideCancel && (
                    <Link to="..">
                        <Button variant="outlined" color="error" size="small">
                            {t("issue.form.cancel")}
                        </Button>
                    </Link>
                )}
            </Box>
        </Box>
    );
};

export default IssueForm;
