import type { ReactNode } from "react";
import type { CustomFieldWithValueT } from "shared/model/types";

export type CustomFieldsParserV2Props = {
    fields: CustomFieldWithValueT[];
    onChange?: (field: CustomFieldWithValueT) => unknown;
    rightAdornmentRenderer?: (field: CustomFieldWithValueT) => ReactNode;
};
