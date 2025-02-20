import type { AgileBoardT, CreateAgileBoardT } from "types";

export const formValuesToCreateForm = (
    form: AgileBoardT,
): CreateAgileBoardT => ({
    ...form,
    columns: form.columns.map((el) => ("value" in el ? el.value : el.state)),
    projects: form.projects.map((project) => project.id),
    column_field: form.column_field.id,
    swimlane_field: form.swimlane_field?.id || null,
    swimlanes: form.swimlanes.map((el) =>
        "value" in el ? el.value : el.state,
    ),
    card_fields: form.card_fields.map((field) => field.id),
    card_colors_fields: form.card_colors_fields.map((field) => field.id),
});
