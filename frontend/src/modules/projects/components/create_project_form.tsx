import { yupResolver } from "@hookform/resolvers/yup";
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Collapse,
    FormControlLabel,
    FormGroup,
    TextField,
    Typography,
} from "@mui/material";
import { Link } from "@tanstack/react-router";
import { MDEditor } from "components";
import type { TFunction } from "i18next";
import type { FC } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { exportPrivateKey, generateKeyPair } from "utils/crypto";
import { downloadTextFile } from "utils/helpers/download-file";
import * as yup from "yup";
import { generateSlug } from "../utils";

const useCreateProjectSchema = (t: TFunction) => {
    return useMemo(
        () =>
            yup.object().shape({
                name: yup
                    .string()
                    .required(t("form.validation.required"))
                    .default(""),
                slug: yup
                    .string()
                    .required(t("form.validation.required"))
                    .default(""),
                description: yup.string(),
                is_encrypted: yup.boolean().default(false),
                encrypt_comments: yup.boolean().default(false),
                encrypt_description: yup.boolean().default(false),
            }),
        [t],
    );
};

export type CreateProjectFormData = yup.InferType<
    ReturnType<typeof useCreateProjectSchema>
>;

interface IProjectFormProps {
    defaultValues?: CreateProjectFormData;
    onSubmit: (formData: CreateProjectFormData) => void;
    loading?: boolean;
    hideCancel?: boolean;
}

const CreateProjectForm: FC<IProjectFormProps> = ({
    defaultValues,
    onSubmit,
    loading,
    hideCancel,
}) => {
    const { t } = useTranslation();
    const createProjectSchema = useCreateProjectSchema(t);
    const keyCreationStarted = useRef<boolean>(false);
    const [keyPair, setKeyPair] = useState<CryptoKeyPair | null>(null);
    const [exportedPrivateKey, setExportedPrivateKey] = useState<string | null>(
        null,
    );

    const { control, handleSubmit, setValue } = useForm<CreateProjectFormData>({
        defaultValues,
        resolver: yupResolver(createProjectSchema),
    });

    const name = useWatch({ control, name: "name" });
    const isEncrypted = useWatch({ control, name: "is_encrypted" });

    useEffect(() => {
        if (isEncrypted && !keyPair && !keyCreationStarted.current) {
            keyCreationStarted.current = true;
            generateKeyPair("X25519")
                .then(async (pair) => {
                    setKeyPair(pair);
                    const temp = await exportPrivateKey(pair.privateKey);
                    setExportedPrivateKey(temp);
                })
                .catch(() => {
                    setValue("is_encrypted", false);
                })
                .finally(() => {
                    keyCreationStarted.current = false;
                });
        }
    }, [isEncrypted, keyPair, setValue]);

    useEffect(() => {
        const slug = generateSlug(name);
        setValue("slug", slug);
    }, [name, setValue]);

    return (
        <Box
            component="form"
            display="flex"
            flexDirection="column"
            gap={2}
            onSubmit={handleSubmit(onSubmit)}
            maxWidth="md"
        >
            <Controller
                control={control}
                name="name"
                render={({ field, fieldState: { error, invalid } }) => (
                    <TextField
                        {...field}
                        value={field.value || ""}
                        label={t("projects.form.name")}
                        error={invalid}
                        helperText={error?.message}
                        variant="outlined"
                        size="small"
                        fullWidth
                    />
                )}
            />

            <Controller
                control={control}
                name="slug"
                render={({ field, fieldState: { error, invalid } }) => (
                    <TextField
                        {...field}
                        value={field.value || ""}
                        slotProps={{
                            inputLabel: { shrink: !!field.value },
                        }}
                        label={t("projects.form.slug")}
                        error={invalid}
                        helperText={error?.message}
                        variant="outlined"
                        size="small"
                        fullWidth
                    />
                )}
            />

            <Box>
                <Controller
                    name="description"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                        <MDEditor
                            value={value || ""}
                            onChange={onChange}
                            placeholder={t("description")}
                        />
                    )}
                />
            </Box>

            <FormControlLabel
                label={t("projects.form.isEncrypted")}
                control={
                    <Controller
                        control={control}
                        name="is_encrypted"
                        render={({ field }) => (
                            <Checkbox
                                {...field}
                                checked={field.value || false}
                                size="small"
                            />
                        )}
                    />
                }
            />

            <Collapse in={!!exportedPrivateKey && isEncrypted}>
                <FormGroup row>
                    <FormControlLabel
                        label={t("projects.form.encryptComments")}
                        control={
                            <Controller
                                control={control}
                                name="encrypt_comments"
                                render={({ field }) => (
                                    <Checkbox
                                        {...field}
                                        checked={field.value || false}
                                        size="small"
                                    />
                                )}
                            />
                        }
                    />
                    <FormControlLabel
                        label={t("projects.form.encryptDescription")}
                        control={
                            <Controller
                                control={control}
                                name="encrypt_description"
                                render={({ field }) => (
                                    <Checkbox
                                        {...field}
                                        checked={field.value || false}
                                        size="small"
                                    />
                                )}
                            />
                        }
                    />
                    <FormControlLabel
                        label={t("projects.form.encryptComments")}
                        control={<Checkbox checked disabled size="small" />}
                    />
                </FormGroup>

                <Alert severity="warning">
                    {t("projects.form.privateKeyAlert")}
                    <br />
                    <br />
                    <Typography variant="caption" whiteSpace="pre-wrap">
                        {exportedPrivateKey}
                    </Typography>
                    <Box mt={2}>
                        <Button
                            variant="outlined"
                            color="warning"
                            size="small"
                            onClick={() =>
                                downloadTextFile(
                                    exportedPrivateKey || "",
                                    `private-key${name ? "-" + name : ""}.pem`,
                                )
                            }
                        >
                            {t("download")}
                        </Button>
                    </Box>
                </Alert>
            </Collapse>

            <Box display="flex" gap={1}>
                <Button
                    type="submit"
                    variant="outlined"
                    size="small"
                    loading={loading || (isEncrypted && !keyPair)}
                >
                    {t("save")}
                </Button>

                {!hideCancel && (
                    <Link to="..">
                        <Button variant="outlined" color="error" size="small">
                            {t("cancel")}
                        </Button>
                    </Link>
                )}
            </Box>
        </Box>
    );
};

export { CreateProjectForm };
