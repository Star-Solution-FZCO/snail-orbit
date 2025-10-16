import type { AgileBoardT, CreateAgileBoardT } from "shared/model/types";

const swimOptionsToValues = (
    option: NonNullable<AgileBoardT["swimlanes"]>["values"][0],
): string | null => {
    if (option === null || option === undefined) return null;
    if (typeof option !== "object") return option.toString();
    if ("value" in option && option.value !== "") return option.value;
    if ("email" in option && !option.email) return null;
    if ("id" in option && option.id !== "") return option.id;
    return null;
};

export const formValuesToCreateForm = (
    form: AgileBoardT,
): CreateAgileBoardT => ({
    ...form,
    columns: form.columns.values.map(swimOptionsToValues),
    projects: form.projects.map((project) => project.id),
    column_field: form.columns.field.gid,
    swimlane_field: form.swimlanes?.field?.gid || null,
    swimlanes: form.swimlanes?.values?.map(swimOptionsToValues),
    card_fields: form.card_fields.map((field) => field.gid),
    card_colors_fields: form.card_colors_fields.map((field) => field.gid),
});
