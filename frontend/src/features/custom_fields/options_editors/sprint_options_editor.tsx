import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
    Box,
    Checkbox,
    CircularProgress,
    FormControlLabel,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import dayjs from "dayjs";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { customFieldsApi } from "shared/model";
import type {
    CreateSprintOptionT,
    CustomFieldT,
    SprintOptionT,
    UpdateSprintOptionT,
} from "shared/model/types";
import { toastApiError } from "shared/utils";
import { DeleteCustomFieldOptionDialog } from "../delete_option_dialog";
import { SprintOptionFormDialog } from "../form_dialogs/sprint_option_form_dialog";

interface ICustomFieldSprintOptionProps {
    option: SprintOptionT;
    onEdit: (option: SprintOptionT) => void;
    onDelete: (option: SprintOptionT) => void;
    readOnly?: boolean;
}

export const formatDate = (date: string | null) => {
    return date ? dayjs(date).format("DD MMM YYYY") : null;
};

const CustomFieldSprintOption: FC<ICustomFieldSprintOptionProps> = ({
    option,
    onEdit,
    onDelete,
    readOnly = false,
}) => {
    const { t } = useTranslation();

    return (
        <Stack gap={0.5} borderBottom={1} borderColor="divider" p={1}>
            <Stack direction="row" alignItems="center" gap={1}>
                <Box
                    sx={{
                        width: "24px",
                        height: "24px",
                        backgroundColor: option.color || "#f0f0f0",
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 0.5,
                    }}
                />

                <Typography flex={1}>{option.value}</Typography>

                <Box flex={1} />

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
            </Stack>

            {option.start_date && option.end_date && (
                <Typography fontSize={14}>
                    {t("customFields.options.sprint.period", {
                        startDate: formatDate(option.start_date),
                        endDate: formatDate(option.end_date),
                    })}
                </Typography>
            )}

            {option.planed_start_date && option.planed_end_date && (
                <Typography fontSize={14}>
                    {t("customFields.options.sprint.plannedPeriod", {
                        startDate: formatDate(option.planed_start_date),
                        endDate: formatDate(option.planed_end_date),
                    })}
                </Typography>
            )}

            <Stack direction="row" gap={1}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={option.is_completed}
                            size="small"
                            disableRipple
                        />
                    }
                    label={t("customFields.options.sprint.completed")}
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
            </Stack>
        </Stack>
    );
};

interface ICustomFieldSprintOptionsEditorProps {
    customField: CustomFieldT;
    readOnly?: boolean;
}

const CustomFieldSprintOptionsEditor: FC<
    ICustomFieldSprintOptionsEditorProps
> = ({ customField, readOnly = false }) => {
    const { t } = useTranslation();

    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<SprintOptionT | null>(
        null,
    );

    const [createOption, { isLoading: createLoading }] =
        customFieldsApi.useCreateCustomFieldSprintOptionMutation();
    const [updateOption, { isLoading: updateLoading }] =
        customFieldsApi.useUpdateCustomFieldSprintOptionMutation();
    const [deleteOption, { isLoading: deleteLoading }] =
        customFieldsApi.useDeleteCustomFieldSprintOptionMutation();

    const handleClickAddOption = () => {
        setFormDialogOpen(true);
    };

    const handleCloseFormDialog = () => {
        setFormDialogOpen(false);
        setSelectedOption(null);
    };

    const handleClickEditOption = (option: SprintOptionT) => {
        setSelectedOption(option);
        setFormDialogOpen(true);
    };

    const handleSaveOption = (
        formData: CreateSprintOptionT | UpdateSprintOptionT,
    ) => {
        if (!selectedOption) {
            createOption({
                id: customField.id,
                ...(formData as CreateSprintOptionT),
            })
                .unwrap()
                .then(() => setFormDialogOpen(false))
                .catch(toastApiError);

            return;
        }

        updateOption({
            id: customField.id,
            ...(formData as UpdateSprintOptionT),
            option_id: selectedOption.uuid,
        })
            .unwrap()
            .then(() => {
                setFormDialogOpen(false);
                setSelectedOption(null);
            })
            .catch(toastApiError);
    };

    const handleClickDeleteOption = (option: SprintOptionT) => {
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

            <Stack>
                {options.map((option) => (
                    <CustomFieldSprintOption
                        key={option.uuid}
                        option={option as SprintOptionT}
                        onEdit={handleClickEditOption}
                        onDelete={handleClickDeleteOption}
                        readOnly={readOnly}
                    />
                ))}
            </Stack>

            <SprintOptionFormDialog
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

export { CustomFieldSprintOptionsEditor };
