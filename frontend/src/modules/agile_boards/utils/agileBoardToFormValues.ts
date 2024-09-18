import { AgileBoardT } from "../../../types";
import { AgileBoardFormData } from "../components/agile_board_form/agile_board_form.schema";

export const agileBoardToFormValues = (
    values: AgileBoardT,
): AgileBoardFormData => ({
    ...values,
});
