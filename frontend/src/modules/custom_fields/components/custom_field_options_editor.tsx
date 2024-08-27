import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    CircularProgress,
    debounce,
    IconButton,
    Modal,
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

interface ICustomFieldOptionProps {
    customFieldId: string;
    option: EnumOptionT;
    onDelete: (option: EnumOptionT) => void;
}

const CustomFieldOption: FC<ICustomFieldOptionProps> = ({
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

interface IDeleteCustomFieldOptionDialogProps {
    customFieldId: string;
    option: EnumOptionT | null;
    onClose: () => void;
}

const DeleteCustomFieldOptionDialog: FC<
    IDeleteCustomFieldOptionDialogProps
> = ({ customFieldId, option, onClose }) => {
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
        <Modal open={!!option} onClose={onClose}>
            <Box
                sx={(theme) => ({
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    backgroundColor: theme.palette.background.paper,
                    p: 4,
                    boxShadow: 16,
                    borderRadius: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                })}
            >
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Typography fontSize={20} fontWeight="bold">
                        {t("customFields.options.deleteTitle")}
                    </Typography>

                    <IconButton
                        onClick={onClose}
                        size="small"
                        disabled={isLoading}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Typography>
                    {t("customFields.options.deleteConfirm")}
                </Typography>

                <Box display="flex" gap={1}>
                    <LoadingButton
                        onClick={handleClickDelete}
                        variant="outlined"
                        loading={isLoading}
                    >
                        {t("customFields.options.delete")}
                    </LoadingButton>
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        color="error"
                        disabled={isLoading}
                    >
                        {t("customFields.options.cancel")}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

interface ICustomFieldOptionsEditorProps {
    customField: CustomFieldT;
}

const CustomFieldOptionsEditor: FC<ICustomFieldOptionsEditorProps> = ({
    customField,
}) => {
    const { t } = useTranslation();

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
                <CustomFieldOption
                    key={option.uuid}
                    customFieldId={customField.id}
                    option={option}
                    onDelete={handleClickDeleteOption}
                />
            ))}

            <DeleteCustomFieldOptionDialog
                customFieldId={customField.id}
                option={selectedOption}
                onClose={() => setSelectedOption(null)}
            />
        </Box>
    );
};

export { CustomFieldOptionsEditor };
