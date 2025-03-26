import type { CreateSearchT } from "types/search";
import type { EditSearchDialogValues } from "./edit_search_dialog";

export const formValuesToCreateValues = (
    value: EditSearchDialogValues,
): CreateSearchT => ({
    ...value,
    permissions: value.permissions.map((el) => ({
        ...el,
        target: el.target.id,
    })),
});
