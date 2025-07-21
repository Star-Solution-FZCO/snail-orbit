import type { TFunction } from "i18next";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Schema } from "yup";

export type SchemaFuncT = (t: TFunction) => Schema;

export const useSchema = (schema: SchemaFuncT): Schema => {
    const { t } = useTranslation();
    return useMemo(() => schema(t), [schema, t]);
};
