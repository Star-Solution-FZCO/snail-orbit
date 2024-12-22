import type { BasicCustomFieldT, CustomFieldT, FieldValueT } from "types";

export type CustomFieldsChipParserProps = {
    availableFields: BasicCustomFieldT[];
    activeFields: Record<string, CustomFieldT>;
    onUpdateIssue: (
        fields: Record<string, FieldValueT>,
    ) => Promise<void> | void;
};
