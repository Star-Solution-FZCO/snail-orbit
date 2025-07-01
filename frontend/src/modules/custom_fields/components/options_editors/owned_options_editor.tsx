import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Box, CircularProgress, IconButton, Typography } from "@mui/material";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { customFieldsApi } from "shared/model";
import type {
    CreateOwnedOptionT,
    CustomFieldT,
    OwnedOptionT,
    UpdateOwnedOptionT,
} from "shared/model/types";
import { toastApiError } from "shared/utils";
import { DeleteCustomFieldOptionDialog } from "../delete_option_dialog";
import { OwnedOptionFormDialog } from "../form_dialogs/owned_option_form_dialog";

interface ICustomFieldOwnedOptionProps {
    option: OwnedOptionT;
    onEdit: (option: OwnedOptionT) => void;
    onDelete: (option: OwnedOptionT) => void;
}

const CustomFieldOwnedOption: FC<ICustomFieldOwnedOptionProps> = ({
    option,
    onEdit,
    onDelete,
}) => {
    return (
        <Box display="flex" alignItems="center" gap={1}>
            <Box
                sx={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: option.color || "#f0f0f0",
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 0.5,
                }}
            />

            <Box flex={1}>
                <Typography>{option.value}</Typography>
                {option.owner && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.75rem" }}
                    >
                        {option.owner.name}
                    </Typography>
                )}
            </Box>

            <IconButton onClick={() => onEdit(option)} size="small">
                <EditIcon />
            </IconButton>

            <IconButton
                onClick={() => onDelete(option)}
                color="error"
                size="small"
            >
                <DeleteIcon />
            </IconButton>
        </Box>
    );
};

interface ICustomFieldOwnedOptionsEditorProps {
    customField: CustomFieldT;
}

const CustomFieldOwnedOptionsEditor: FC<
    ICustomFieldOwnedOptionsEditorProps
> = ({ customField }) => {
    const { t } = useTranslation();

    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<OwnedOptionT | null>(
        null,
    );

    const [createOption, { isLoading: createLoading }] =
        customFieldsApi.useCreateCustomFieldOwnedOptionMutation();
    const [updateOption, { isLoading: updateLoading }] =
        customFieldsApi.useUpdateCustomFieldOwnedOptionMutation();
    const [deleteOption, { isLoading: deleteLoading }] =
        customFieldsApi.useDeleteCustomFieldOwnedOptionMutation();

    const handleClickAddOption = () => {
        setFormDialogOpen(true);
    };

    const handleCloseFormDialog = () => {
        setFormDialogOpen(false);
        setSelectedOption(null);
    };

    const handleClickEditOption = (option: OwnedOptionT) => {
        setSelectedOption(option);
        setFormDialogOpen(true);
    };

    const handleSaveOption = (
        formData: CreateOwnedOptionT | UpdateOwnedOptionT,
    ) => {
        try {
            if (!selectedOption) {
                createOption({
                    id: customField.id,
                    ...(formData as CreateOwnedOptionT),
                })
                    .unwrap()
                    .then(() => setFormDialogOpen(false))
                    .catch(toastApiError);

                return;
            }

            updateOption({
                id: customField.id,
                ...(formData as UpdateOwnedOptionT),
                option_id: selectedOption.uuid,
            })
                .unwrap()
                .then(() => {
                    setFormDialogOpen(false);
                    setSelectedOption(null);
                })
                .catch(toastApiError);
        } catch (error) {
            console.error("Error in handleSaveOption:", error);
        }
    };

    const handleClickDeleteOption = (option: OwnedOptionT) => {
        setSelectedOption(option);
        setDeleteDialogOpen(true);
    };

    const deleteSelectedOption = () => {
        if (!selectedOption) {
            return;
        }

        deleteOption({
            id: customField.id,
            option_id: selectedOption.uuid,
        })
            .unwrap()
            .then(() => {
                setDeleteDialogOpen(false);
                setSelectedOption(null);
            })
            .catch(toastApiError);
    };

    const options = "options" in customField ? customField.options : [];

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
                <Typography fontSize={20} fontWeight="bold" lineHeight={1.8}>
                    {t("customFields.options.title")}
                </Typography>

                <IconButton onClick={handleClickAddOption} size="small">
                    <AddIcon />
                </IconButton>

                {createLoading && (
                    <CircularProgress size={20} color="inherit" />
                )}
            </Box>

            {options.length === 0 && (
                <Typography>{t("customFields.options.empty")}</Typography>
            )}

            {options.map((option) => (
                <CustomFieldOwnedOption
                    key={option.uuid}
                    option={option as OwnedOptionT}
                    onEdit={handleClickEditOption}
                    onDelete={handleClickDeleteOption}
                />
            ))}

            {formDialogOpen && (
                <OwnedOptionFormDialog
                    open={formDialogOpen}
                    onClose={handleCloseFormDialog}
                    onSubmit={handleSaveOption}
                    defaultValues={selectedOption}
                    loading={createLoading || updateLoading}
                />
            )}

            {deleteDialogOpen && (
                <DeleteCustomFieldOptionDialog
                    open={deleteDialogOpen}
                    onClose={() => setDeleteDialogOpen(false)}
                    onDelete={deleteSelectedOption}
                    loading={deleteLoading}
                />
            )}
        </Box>
    );
};

export { CustomFieldOwnedOptionsEditor };
