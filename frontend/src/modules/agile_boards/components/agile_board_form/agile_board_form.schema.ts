import * as yup from "yup";

export const agileBoardProjectSchema = yup.object().shape({
    id: yup.string().required(),
    name: yup.string().required(),
    slug: yup.string().required(),
});

export type AgileBoardProject = yup.InferType<typeof agileBoardProjectSchema>;

export const agileBoardColumnFieldSchema = yup.object().shape({
    id: yup.string().required(),
    name: yup.string().required(),
});

export type AgileBoardColumnField = yup.InferType<
    typeof agileBoardColumnFieldSchema
>;

export const agileBoardSchema = yup.object().shape({
    name: yup.string().required("form.validation.required"),
    description: yup.string().nullable().default(null),
    query: yup.string().nullable().default(null),
    column_field: agileBoardColumnFieldSchema.required(
        "form.validation.required",
    ),
    columns: yup
        .array()
        .of(yup.object().shape({ name: yup.string().required() }))
        .required()
        .default([]),
    projects: yup
        .array()
        .of(agileBoardProjectSchema.required())
        .required("form.validation.required")
        .default([]),
    swimlane_field: yup.string().nullable().default(null),
    swimlanes: yup.array().of(yup.string().required()).required().default([]),
});

export type AgileBoardFormData = yup.InferType<typeof agileBoardSchema>;
