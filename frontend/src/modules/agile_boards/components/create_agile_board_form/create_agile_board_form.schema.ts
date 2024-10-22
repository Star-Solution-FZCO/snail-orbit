import { TFunction } from "i18next";
import * as yup from "yup";

export const createAgileBoardProjectSchema = yup.object().shape({
    id: yup.string().required(),
    name: yup.string().required(),
    slug: yup.string().required(),
});

export type CreateAgileBoardProject = yup.InferType<
    typeof createAgileBoardProjectSchema
>;

export const agileBoardColumnFieldSchema = yup.object().shape({
    id: yup.string().required(),
    name: yup.string().required(),
});

export type AgileBoardColumnField = yup.InferType<
    typeof agileBoardColumnFieldSchema
>;

export const getCreateAgileBoardSchema = (t: TFunction) =>
    yup.object().shape({
        name: yup.string().required(t("form.validation.required")),
        description: yup.string().nullable().default(null),
        projects: yup
            .array()
            .of(createAgileBoardProjectSchema.required())
            .required(t("form.validation.required"))
            .default([]),
        column_field: agileBoardColumnFieldSchema.required(
            t("form.validation.required"),
        ),
    });

export type CreateAgileBoardFormData = yup.InferType<
    ReturnType<typeof getCreateAgileBoardSchema>
>;
