import type {
    CustomFieldValueT,
    CustomFieldWithValueT,
} from "shared/model/types";
import type { CustomFieldLinkOutput } from "shared/model/types/backend-schema.gen";

export type CustomFieldsChipParserProps = {
    availableFields: CustomFieldLinkOutput[];
    activeFields: Record<string, CustomFieldWithValueT>;
    onUpdateIssue: (
        fields: Record<string, CustomFieldValueT>,
    ) => Promise<void> | void;
};
