import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Box, CircularProgress, IconButton, Typography } from "@mui/material";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { customFieldsApi } from "store";
import {
    CreateEnumOptionT,
    CustomFieldT,
    EnumOptionT,
    UpdateEnumOptionT,
} from "types";
import { toastApiError } from "utils";
import { DeleteCustomFieldOptionDialog } from "./delete_option_dialog";
import { OptionFormDialog } from "./option_form_dialog";

interface ICustomFieldEnumOptionProps {
    option: EnumOptionT;
    onEdit: (option: EnumOptionT) => void;
    onDelete: (option: EnumOptionT) => void;
}

const CustomFieldEnumOption: FC<ICustomFieldEnumOptionProps> = ({
    option,
    onEdit,
    onDelete,
}) => {
    return (
        <Box display="flex" alignItems="center" gap={1}>
            <Box
                sx={{
                    width: "40px",
                    height: "40px",
                    backgroundColor: option.color,
                    borderRadius: 0.5,
                }}
            />

            <Typography flex={1}>{option.value}</Typography>

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

interface ICustomFieldEnumOptionsEditorProps {
    customField: CustomFieldT;
}

const CustomFieldEnumOptionsEditor: FC<ICustomFieldEnumOptionsEditorProps> = ({
    customField,
}) => {
    const { t } = useTranslation();

    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<EnumOptionT | null>(
        null,
    );

    const [createOption, { isLoading: createLoading }] =
        customFieldsApi.useCreateCustomFieldEnumOptionMutation();
    const [updateOption, { isLoading: updateLoading }] =
        customFieldsApi.useUpdateCustomFieldEnumOptionMutation();
    const [deleteOption, { isLoading: deleteLoading }] =
        customFieldsApi.useDeleteCustomFieldEnumOptionMutation();

    const handleClickAddOption = () => {
        setFormDialogOpen(true);
    };

    const handleCloseFormDialog = () => {
        setFormDialogOpen(false);
        setSelectedOption(null);
    };

    const handleClickEditOption = (option: EnumOptionT) => {
        setSelectedOption(option);
        setFormDialogOpen(true);
    };

    const handleSaveOption = (
        formData: CreateEnumOptionT | UpdateEnumOptionT,
    ) => {
        if (!selectedOption) {
            createOption({
                id: customField.id,
                ...(formData as CreateEnumOptionT),
            })
                .unwrap()
                .then(() => setFormDialogOpen(false))
                .catch(toastApiError);

            return;
        }

        updateOption({
            id: customField.id,
            ...(formData as UpdateEnumOptionT),
            option_id: selectedOption.uuid,
        })
            .unwrap()
            .then(() => {
                setFormDialogOpen(false);
                setSelectedOption(null);
            })
            .catch(toastApiError);
    };

    const handleClickDeleteOption = (option: EnumOptionT) => {
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

    const options = customField.options || [];

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
                <CustomFieldEnumOption
                    key={option.uuid}
                    option={option as EnumOptionT}
                    onEdit={handleClickEditOption}
                    onDelete={handleClickDeleteOption}
                />
            ))}

            <OptionFormDialog
                open={formDialogOpen}
                onClose={handleCloseFormDialog}
                onSubmit={handleSaveOption}
                defaultValues={selectedOption}
                loading={createLoading || updateLoading}
            />

            <DeleteCustomFieldOptionDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onDelete={deleteSelectedOption}
                loading={deleteLoading}
            />
        </Box>
    );
};

export { CustomFieldEnumOptionsEditor };
