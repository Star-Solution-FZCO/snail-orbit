import { TFunction } from "i18next";
import { columnsStrategies, customFieldsTypes } from "types";
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

export const agileBoardColumnSchema = yup.object().shape({
    value: yup.string().required(),
    color: yup.string(),
});

export type AgileBoardColumn = yup.InferType<typeof agileBoardColumnSchema>;

export const agileBoardCardFieldSchema = yup.object().shape({
    id: yup.string().required(),
    name: yup.string().required(),
    type: yup.string().oneOf(customFieldsTypes).required(),
});

export const uiSettingsSchema = yup.object().shape({
    minCardHeight: yup.string().default(""),
    columnsStrategy: yup
        .string()
        .oneOf(columnsStrategies)
        .required()
        .default("column"),
    columns: yup.number().default(1),
    columnMaxWidth: yup.number().default(120),
});

export const getAgileBoardSchema = (t: TFunction) =>
    yup.object().shape({
        name: yup.string().required(t("form.validation.required")),
        description: yup.string().nullable().default(null),
        query: yup.string().nullable().default(null),
        column_field: agileBoardColumnFieldSchema.required(
            t("form.validation.required"),
        ),
        columns: yup.array().of(agileBoardColumnSchema).required().default([]),
        projects: yup
            .array()
            .of(agileBoardProjectSchema.required())
            .required(t("form.validation.required"))
            .default([]),
        swimlane_field: agileBoardColumnFieldSchema.nullable().default(null),
        swimlanes: yup
            .array()
            .of(agileBoardColumnSchema)
            .required()
            .default([]),
        card_fields: yup
            .array()
            .of(agileBoardCardFieldSchema)
            .required()
            .default([]),
        card_colors_fields: yup
            .array()
            .of(agileBoardCardFieldSchema)
            .required()
            .default([]),
        ui_settings: uiSettingsSchema,
    });

export type AgileBoardFormData = yup.InferType<
    ReturnType<typeof getAgileBoardSchema>
>;
