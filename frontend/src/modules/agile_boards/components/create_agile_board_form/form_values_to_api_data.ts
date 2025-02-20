import type { CreateAgileBoardT } from "types";
import type { FormValues } from "./create_agile_board_form.types";

export const form_values_to_api_data = (
    form: FormValues,
): CreateAgileBoardT => ({
    name: form.name,
    projects: form.projects.map((el) => el.id),
    description: form.description,
    columns: [],
    column_field: form.column_field?.id || "",
    swimlanes: [],
    swimlane_field: null,
    query: "",
    card_fields: [],
    card_colors_fields: [],
});
