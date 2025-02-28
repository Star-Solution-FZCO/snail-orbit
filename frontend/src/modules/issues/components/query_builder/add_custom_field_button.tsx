import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";
import { FormAutocompletePopover } from "components/fields/form_autocomplete/form_autocomplete";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { CustomFieldT } from "types";

type AddCustomFieldButtonProps = {
    fields: CustomFieldT[];
    loading?: boolean;
    onSelected?: (field: CustomFieldT) => void;
};

export const AddCustomFieldButton: FC<AddCustomFieldButtonProps> = ({
    fields,
    loading,
    onSelected,
}) => {
    const { t } = useTranslation();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    return (
        <>
            <Button
                size="small"
                onClick={(e) => setAnchorEl(e.currentTarget)}
                variant="outlined"
            >
                <AddIcon />
                {t("queryBuilder.addCustomFieldButton.add")}
            </Button>

            <FormAutocompletePopover
                id="add-cutom-field-popover"
                anchorEl={anchorEl}
                options={fields}
                onClose={() => setAnchorEl(null)}
                onChange={(_, selectedField) =>
                    selectedField &&
                    selectedField &&
                    onSelected?.(
                        Array.isArray(selectedField)
                            ? selectedField[0]
                            : selectedField,
                    )
                }
                open={!!anchorEl}
                loading={loading}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={(el) => el.name}
            />
        </>
    );
};
