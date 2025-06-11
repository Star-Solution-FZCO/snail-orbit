import type { AgileBoardT, CreateAgileBoardT } from "shared/model/types";
import { notEmpty } from "shared/utils/helpers/notEmpty";

export const formValuesToCreateForm = (
    form: AgileBoardT,
): CreateAgileBoardT => ({
    ...form,
    columns: form.columns.values.filter(notEmpty).map((el) => el.value),
    projects: form.projects.map((project) => project.id),
    column_field: form.columns.field.gid,
    swimlane_field: form.swimlanes?.field?.gid || null,
    swimlanes: form.swimlanes?.values
        ?.filter(notEmpty)
        .map((el) => (typeof el === "object" && "value" in el ? el.value : el)),
    card_fields: form.card_fields.map((field) => field.gid),
    card_colors_fields: form.card_colors_fields.map((field) => field.gid),
});
