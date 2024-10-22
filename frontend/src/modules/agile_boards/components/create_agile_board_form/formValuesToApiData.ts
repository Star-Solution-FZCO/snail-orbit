import { CreateAgileBoardT } from "types";
import { CreateAgileBoardFormData } from "./create_agile_board_form.schema";

export const formValuesToApiData = (
    form: CreateAgileBoardFormData,
): CreateAgileBoardT => ({
    name: form.name,
    projects: form.projects.map((el) => el.id),
    description: form.description,
    columns: [],
    column_field: form.column_field.id,
    swimlanes: [],
    swimlane_field: null,
    query: "",
});
