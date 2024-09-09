import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    CircularProgress,
    debounce,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Popover,
    TextField,
    Typography,
} from "@mui/material";
import ColorPicker from "@uiw/react-color-compact";
import { FC, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { customFieldsApi } from "store";
import { CustomFieldT, EnumOptionT } from "types";
import { toastApiError } from "utils";

interface ICustomFieldEnumOptionProps {
    customFieldId: string;
    option: EnumOptionT;
    onDelete: (option: EnumOptionT) => void;
}

const CustomFieldEnumOption: FC<ICustomFieldEnumOptionProps> = ({
    customFieldId,
    option,
    onDelete,
}) => {
    const { t } = useTranslation();

    const [updateOption] =
        customFieldsApi.useUpdateCustomFieldEnumOptionMutation();

    const [color, setColor] = useState<string | null>(option.color);
    const [value, setValue] = useState<string>(option.value);

    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const handleClickColorPicker = (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseColorPicker = () => {
        setAnchorEl(null);
    };

    const handleChangeColor = (newColor: string) => {
        setColor(newColor);

        updateOption({
            id: customFieldId,
            option_id: option.uuid,
            color: newColor,
        })
            .unwrap()
            .catch(toastApiError);

        handleCloseColorPicker();
    };

    const updateValue = (newValue: string) => {
        updateOption({
            id: customFieldId,
            option_id: option.uuid,
            value: newValue,
        })
            .unwrap()
            .catch(toastApiError);
    };

    const debouncedUpdateValue = useCallback(debounce(updateValue, 500), []);

    const handleChangeValue = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = event.target.value;

            setValue(newValue);
            debouncedUpdateValue(newValue);
        },
        [],
    );

    const open = Boolean(anchorEl);

    return (
        <Box display="flex" alignItems="stretch" gap={1}>
            <Button
                sx={{
                    minWidth: "40px",
                    backgroundColor: color,
                    "&:hover": {
                        backgroundColor: color,
                    },
                }}
                onClick={handleClickColorPicker}
                variant="outlined"
            />
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleCloseColorPicker}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
            >
                <ColorPicker
                    color={color || ""}
                    onChange={(color) => handleChangeColor(color.hex)}
                />
            </Popover>

            <TextField
                value={value}
                onChange={handleChangeValue}
                placeholder={t("customFields.options.value")}
                size="small"
                fullWidth
            />

            <Button
                onClick={() => onDelete(option)}
                color="error"
                variant="outlined"
            >
                <DeleteIcon />
            </Button>
        </Box>
    );
};

interface IDeleteCustomFieldEnumOptionDialogProps {
    open: boolean;
    customFieldId: string;
    option: EnumOptionT | null;
    onClose: () => void;
}

const DeleteCustomFieldEnumOptionDialog: FC<
    IDeleteCustomFieldEnumOptionDialogProps
> = ({ open, customFieldId, option, onClose }) => {
    const { t } = useTranslation();

    const [deleteOption, { isLoading }] =
        customFieldsApi.useDeleteCustomFieldEnumOptionMutation();

    const handleClickDelete = () => {
        if (!option) {
            return;
        }

        deleteOption({
            id: customFieldId,
            option_id: option.uuid,
        })
            .unwrap()
            .then(onClose)
            .catch(toastApiError);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                {t("customFields.options.delete.title")}

                <IconButton
                    sx={{ p: 0 }}
                    onClick={onClose}
                    size="small"
                    disabled={isLoading}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <DialogContentText>
                    {t("customFields.options.delete.confirmation")}
                </DialogContentText>
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="error"
                    disabled={isLoading}
                >
                    {t("cancel")}
                </Button>

                <LoadingButton
                    onClick={handleClickDelete}
                    variant="outlined"
                    loading={isLoading}
                >
                    {t("delete")}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

interface ICustomFieldEnumOptionsEditorProps {
    customField: CustomFieldT;
}

const CustomFieldEnumOptionsEditor: FC<ICustomFieldEnumOptionsEditorProps> = ({
    customField,
}) => {
    const { t } = useTranslation();

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<EnumOptionT | null>(
        null,
    );

    const [createOption, { isLoading }] =
        customFieldsApi.useCreateCustomFieldEnumOptionMutation();

    const handleClickAddOption = () => {
        createOption({
            id: customField.id,
            value: "",
            color: null,
        })
            .unwrap()
            .then()
            .catch(toastApiError);
    };

    const handleClickDeleteOption = (option: EnumOptionT) => {
        setSelectedOption(option);
        setDeleteDialogOpen(true);
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

                {isLoading && <CircularProgress size={20} color="inherit" />}
            </Box>

            {options.length === 0 && (
                <Typography>{t("customFields.options.empty")}</Typography>
            )}

            {options.map((option) => (
                <CustomFieldEnumOption
                    key={option.uuid}
                    customFieldId={customField.id}
                    option={option as EnumOptionT}
                    onDelete={handleClickDeleteOption}
                />
            ))}

            <DeleteCustomFieldEnumOptionDialog
                open={deleteDialogOpen}
                customFieldId={customField.id}
                option={selectedOption}
                onClose={() => setDeleteDialogOpen(false)}
            />
        </Box>
    );
};

export { CustomFieldEnumOptionsEditor };
