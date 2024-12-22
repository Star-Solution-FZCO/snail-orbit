import type { ReactNode } from "react";
import type { CustomFieldT, FieldValueT } from "types";

export type CustomFieldsParserProps = {
    availableFields: CustomFieldT[];
    activeFields: Record<string, CustomFieldT>;
    onUpdateIssue?: (
        fields: Record<string, FieldValueT>,
    ) => Promise<void> | void;
    onUpdateCache?: (
        fields: Record<string, CustomFieldT>,
    ) => Promise<void> | void;
    rightAdornmentRenderer?: (field: CustomFieldT) => ReactNode;
};
