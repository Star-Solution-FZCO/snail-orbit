import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
    Box,
    Checkbox,
    CircularProgress,
    FormControlLabel,
    IconButton,
    Typography,
} from "@mui/material";
import { t } from "i18next";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { customFieldsApi } from "store";
import {
    CreateStateOptionT,
    CustomFieldT,
    StateOptionT,
    UpdateStateOptionT,
} from "types";
import { toastApiError } from "utils";
import { DeleteCustomFieldOptionDialog } from "./delete_option_dialog";
import { StateOptionFormDialog } from "./state_option_form_dialog";

interface ICustomFieldStateOptionProps {
    option: StateOptionT;
    onEdit: (option: StateOptionT) => void;
    onDelete: (option: StateOptionT) => void;
}

const CustomFieldStateOption: FC<ICustomFieldStateOptionProps> = ({
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
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 0.5,
                }}
            />

            <Typography flex={1}>{option.value}</Typography>

            <FormControlLabel
                control={
                    <Checkbox
                        checked={option.is_resolved}
                        size="small"
                        disableRipple
                    />
                }
                label={t("customFields.options.state.resolved")}
            />

            <FormControlLabel
                control={
                    <Checkbox
                        checked={option.is_closed}
                        size="small"
                        disableRipple
                    />
                }
                label={t("customFields.options.state.closed")}
            />

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

interface ICustomFieldStateOptionsEditorProps {
    customField: CustomFieldT;
}

const CustomFieldStateOptionsEditor: FC<
    ICustomFieldStateOptionsEditorProps
> = ({ customField }) => {
    const { t } = useTranslation();

    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<StateOptionT | null>(
        null,
    );

    const [createOption, { isLoading: createLoading }] =
        customFieldsApi.useCreateCustomFieldStateOptionMutation();
    const [updateOption, { isLoading: updateLoading }] =
        customFieldsApi.useUpdateCustomFieldStateOptionMutation();
    const [deleteOption, { isLoading: deleteLoading }] =
        customFieldsApi.useDeleteCustomFieldStateOptionMutation();

    const handleClickAddOption = () => {
        setSelectedOption(null);
        setFormDialogOpen(true);
    };

    const handleCloseFormDialog = () => {
        setFormDialogOpen(false);
        setSelectedOption(null);
    };

    const handleClickEditOption = (option: StateOptionT) => {
        setSelectedOption(option);
        setFormDialogOpen(true);
    };

    const handleSaveOption = (
        formData: CreateStateOptionT | UpdateStateOptionT,
    ) => {
        if (!selectedOption) {
            createOption({
                id: customField.id,
                ...(formData as CreateStateOptionT),
            })
                .unwrap()
                .then(() => setFormDialogOpen(false))
                .catch(toastApiError);

            return;
        }

        updateOption({
            id: customField.id,
            ...(formData as UpdateStateOptionT),
            option_id: selectedOption.uuid,
        })
            .unwrap()
            .then(() => {
                setFormDialogOpen(false);
                setSelectedOption(null);
            })
            .catch(toastApiError);
    };

    const handleClickDeleteOption = (option: StateOptionT) => {
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
                <CustomFieldStateOption
                    key={option.uuid}
                    option={option as StateOptionT}
                    onEdit={handleClickEditOption}
                    onDelete={handleClickDeleteOption}
                />
            ))}

            <StateOptionFormDialog
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

export { CustomFieldStateOptionsEditor };
