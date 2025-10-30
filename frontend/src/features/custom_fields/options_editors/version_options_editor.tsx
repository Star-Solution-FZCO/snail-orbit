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
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "shared/date";
import { customFieldsApi } from "shared/model";
import type {
    CreateVersionOptionT,
    CustomFieldT,
    UpdateVersionOptionT,
    VersionOptionT,
} from "shared/model/types";
import { toastApiError } from "shared/utils";
import { DeleteCustomFieldOptionDialog } from "../delete_option_dialog";
import { VersionOptionFormDialog } from "../form_dialogs/version_option_form_dialog";

interface ICustomFieldVersionOptionProps {
    option: VersionOptionT;
    onEdit: (option: VersionOptionT) => void;
    onDelete: (option: VersionOptionT) => void;
    readOnly?: boolean;
}

const CustomFieldVersionOption: FC<ICustomFieldVersionOptionProps> = ({
    option,
    onEdit,
    onDelete,
    readOnly = false,
}) => {
    const releaseDate = option.release_date
        ? `(${dayjs(option.release_date).format("DD MMM YYYY")})`
        : null;

    return (
        <Box display="flex" alignItems="center" gap={1}>
            <Typography flex={1}>
                {option.value} {releaseDate}
            </Typography>

            <FormControlLabel
                control={
                    <Checkbox
                        checked={option.is_released}
                        size="small"
                        disableRipple
                    />
                }
                label={t("customFields.options.version.released")}
            />

            <FormControlLabel
                control={
                    <Checkbox
                        checked={option.is_archived}
                        size="small"
                        disableRipple
                    />
                }
                label={t("customFields.options.version.archived")}
            />

            {!readOnly && (
                <>
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
                </>
            )}
        </Box>
    );
};

interface ICustomFieldVersionOptionsEditorProps {
    customField: CustomFieldT;
    readOnly?: boolean;
}

const CustomFieldVersionOptionsEditor: FC<
    ICustomFieldVersionOptionsEditorProps
> = ({ customField, readOnly = false }) => {
    const { t } = useTranslation();

    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<VersionOptionT | null>(
        null,
    );

    const [createOption, { isLoading: createLoading }] =
        customFieldsApi.useCreateCustomFieldVersionOptionMutation();
    const [updateOption, { isLoading: updateLoading }] =
        customFieldsApi.useUpdateCustomFieldVersionOptionMutation();
    const [deleteOption, { isLoading: deleteLoading }] =
        customFieldsApi.useDeleteCustomFieldVersionOptionMutation();

    const handleClickAddOption = () => {
        setFormDialogOpen(true);
    };

    const handleCloseFormDialog = () => {
        setFormDialogOpen(false);
        setSelectedOption(null);
    };

    const handleClickEditOption = (option: VersionOptionT) => {
        setSelectedOption(option);
        setFormDialogOpen(true);
    };

    const handleSaveOption = (
        formData: CreateVersionOptionT | UpdateVersionOptionT,
    ) => {
        if (!selectedOption) {
            createOption({
                id: customField.id,
                ...(formData as CreateVersionOptionT),
            })
                .unwrap()
                .then(() => setFormDialogOpen(false))
                .catch(toastApiError);

            return;
        }

        updateOption({
            id: customField.id,
            ...(formData as UpdateVersionOptionT),
            option_id: selectedOption.uuid,
        })
            .unwrap()
            .then(() => {
                setFormDialogOpen(false);
                setSelectedOption(null);
            })
            .catch(toastApiError);
    };

    const handleClickDeleteOption = (option: VersionOptionT) => {
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

    const options = "options" in customField ? customField.options || [] : [];

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
                <Typography fontSize={20} fontWeight="bold" lineHeight={1.8}>
                    {t("customFields.options.title")}
                </Typography>

                {!readOnly && (
                    <IconButton onClick={handleClickAddOption} size="small">
                        <AddIcon />
                    </IconButton>
                )}

                {createLoading && (
                    <CircularProgress size={20} color="inherit" />
                )}
            </Box>

            {options.length === 0 && (
                <Typography>{t("customFields.options.empty")}</Typography>
            )}

            {options.map((option) => (
                <CustomFieldVersionOption
                    key={option.uuid}
                    option={option as VersionOptionT}
                    onEdit={handleClickEditOption}
                    onDelete={handleClickDeleteOption}
                    readOnly={readOnly}
                />
            ))}

            <VersionOptionFormDialog
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

export { CustomFieldVersionOptionsEditor };
