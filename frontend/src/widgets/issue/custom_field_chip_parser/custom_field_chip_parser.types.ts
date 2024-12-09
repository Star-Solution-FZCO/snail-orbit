import type { CustomFieldTypeT, IssueT, UpdateIssueT } from "types";

type FieldData = {
    id: string;
    name: string;
    type: CustomFieldTypeT;
};

export type CustomFieldsChipParserProps = {
    fields: FieldData[];
    issue: IssueT;
    onUpdateIssue: (issueValues: UpdateIssueT) => Promise<void> | void;
};
