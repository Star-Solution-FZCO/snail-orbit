import { BasicCustomFieldT } from "./custom_fields";
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

export type AgileBoardT = Omit<CreateAgileBoardT, "projects"> & {
    id: string;
    description: string | null;
    query: string | null;
    projects: BasicProjectT[];
    columns: ColumnT[];
    column_field: ColumnT | null;
    swimlane_field: ColumnT | null;
    swimlanes: ColumnT[];
};

export type UpdateAgileBoardT = Partial<CreateAgileBoardT>;
