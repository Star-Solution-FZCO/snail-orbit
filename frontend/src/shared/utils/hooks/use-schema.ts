import { TFunction } from "i18next";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Schema } from "yup";

export type SchemaFuncT = (t: TFunction) => Schema;

export const useSchema = (schema: SchemaFuncT): any => {
    const { t, i18n } = useTranslation();
    return useMemo(() => schema(t), [i18n.language]);
};
