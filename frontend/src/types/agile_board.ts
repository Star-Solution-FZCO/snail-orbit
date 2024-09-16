import { BasicCustomFieldT, CustomFieldValueT } from "./custom_fields";
import { BasicProjectT } from "./project";

export type CreateAgileBoardT = {
    name: string;
    description: string | null;
    query: string | null;
    column_field: BasicCustomFieldT;
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
    columns: CustomFieldValueT[];
    swimlane_field: BasicCustomFieldT | null;
    swimlanes: CustomFieldValueT[];
};

export type UpdateAgileBoardT = Partial<CreateAgileBoardT>;
