import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";
import { FormAutocompletePopover } from "components/fields/form_autocomplete/form_autocomplete";
import type { FormAutocompleteValueType } from "components/fields/form_autocomplete/form_autocomplete_content";
import type { FC } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CustomFieldT } from "types";

type AddCustomFieldButtonProps = {
    fields: CustomFieldT[];
    loading?: boolean;
    onSelected?: (field: CustomFieldT) => void;
};

type AutocompleteOption = FormAutocompleteValueType & {
    field: CustomFieldT;
};

export const AddCustomFieldButton: FC<AddCustomFieldButtonProps> = ({
    fields,
    loading,
    onSelected,
}) => {
    const { t } = useTranslation();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const options: AutocompleteOption[] = useMemo(() => {
        return fields.map((field) => ({
            label: field.name,
            description: field.type,
            field,
        }));
    }, [fields]);

    return (
        <>
            <Button size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
                <AddIcon />
                {t("queryBuilder.addCustomFieldButton.add")}
            </Button>

            <FormAutocompletePopover
                id="add-cutom-field-popover"
                anchorEl={anchorEl}
                options={options}
                onClose={() => setAnchorEl(null)}
                onChange={(_, selectedField) =>
                    selectedField &&
                    onSelected?.((selectedField as AutocompleteOption).field)
                }
                open={!!anchorEl}
                loading={loading}
                isOptionEqualToValue={(option, value) => option.id === value.id}
            />
        </>
    );
};
