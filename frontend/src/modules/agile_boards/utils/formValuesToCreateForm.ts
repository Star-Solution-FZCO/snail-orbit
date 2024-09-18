import { CreateAgileBoardT } from "../../../types";
import { AgileBoardFormData } from "../components/agile_board_form/agile_board_form.schema";

export const formValuesToCreateForm = (
    form: AgileBoardFormData,
): CreateAgileBoardT => ({
    ...form,
    columns: form.columns.map((el) => el.name),
    projects: form.projects.map((project) => project.id),
    column_field: form.column_field.id,
});
