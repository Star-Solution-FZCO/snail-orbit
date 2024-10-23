import { BasicCustomFieldT } from "./custom_fields";
import { IssueT } from "./issue";
import { BasicProjectT } from "./project";

export type ColumnT = BasicCustomFieldT;

export type CreateAgileBoardT = {
    name: string;
    description: string | null;
    query: string | null;
    column_field: string;
    columns: string[];
    projects: string[];
    swimlane_field: string | null; // custom field id
    swimlanes: string[]; // list of custom field ids
};

export type AgileBoardT = {
    id: string;
    name: string;
    description: string | null;
    query: string | null;
    projects: BasicProjectT[];
    columns: AgileFieldValueT[];
    column_field: ColumnT;
    swimlane_field: ColumnT | null;
    swimlanes: AgileFieldValueT[];
};

export type UpdateAgileBoardT = Partial<CreateAgileBoardT>;

export type AgileFieldValueT = {
    value: string;
    color?: string;
};

export type AgileColumnT = {
    field_value: AgileFieldValueT | null;
    issues: IssueT[];
};

export type AgileSwimLineT = {
    field_value: AgileFieldValueT | null;
    columns: AgileColumnT[];
};

export type MoveIssueT = {
    board_id: string;
    issue_id: string;
    column: string | null;
    swimlane: string | null;
    after_issue: string | null;
};
