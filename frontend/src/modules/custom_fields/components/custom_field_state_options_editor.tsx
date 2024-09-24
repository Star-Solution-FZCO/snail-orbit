import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    debounce,
    FormControlLabel,
    IconButton,
    Popover,
    TextField,
    Typography,
} from "@mui/material";
import ColorPicker from "@uiw/react-color-compact";
import { FC, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { customFieldsApi } from "store";
import { CustomFieldT, EnumOptionT, StateOptionT } from "types";
import { toastApiError } from "utils";
import { DeleteCustomFieldOptionDialog } from "./delete_option_dialog";

interface ICustomFieldStateOptionProps {
    customFieldId: string;
    option: StateOptionT;
    onDelete: (option: StateOptionT) => void;
}

const CustomFieldStateOption: FC<ICustomFieldStateOptionProps> = ({
    customFieldId,
    option,
    onDelete,
}) => {
    const { t } = useTranslation();

    const [updateOption, { isLoading }] =
        customFieldsApi.useUpdateCustomFieldStateOptionMutation();

    const [color, setColor] = useState<string | null>(option.color);
    const [value, setValue] = useState<string>(option.value);
    const [isResolved, setIsResolved] = useState<boolean>(option.is_resolved);
    const [isClosed, setIsClosed] = useState<boolean>(option.is_closed);

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

    const updateState = (newValue: string) => {
        updateOption({
            id: customFieldId,
            option_id: option.uuid,
            state: newValue, // pay attention to StateOptionUpdateBody
        })
            .unwrap()
            .catch(toastApiError);
    };

    const debouncedUpdateValue = useCallback(debounce(updateState, 500), []);

    const handleChangeValue = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = event.target.value;

            setValue(newValue);
            debouncedUpdateValue(newValue);
        },
        [],
    );

    const handleChangeIsResolved = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const newValue = event.target.checked;

        setIsResolved(newValue);

        updateOption({
            id: customFieldId,
            option_id: option.uuid,
            is_resolved: newValue,
        })
            .unwrap()
            .catch(toastApiError);
    };

    const handleChangeIsClosed = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const newValue = event.target.checked;

        setIsClosed(newValue);

        updateOption({
            id: customFieldId,
            option_id: option.uuid,
            is_closed: newValue,
        })
            .unwrap()
            .catch(toastApiError);
    };

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
                InputProps={{
                    endAdornment: isLoading && (
                        <Box display="flex">
                            <CircularProgress color="inherit" size={20} />
                        </Box>
                    ),
                }}
                placeholder={t("customFields.options.value")}
                size="small"
                fullWidth
            />

            <FormControlLabel
                control={
                    <Checkbox
                        checked={isResolved}
                        onChange={handleChangeIsResolved}
                        size="small"
                        disableRipple
                    />
                }
                label={t("customFields.options.state.resolved")}
            />

            <FormControlLabel
                control={
                    <Checkbox
                        checked={isClosed}
                        onChange={handleChangeIsClosed}
                        size="small"
                        disableRipple
                    />
                }
                label={t("customFields.options.state.closed")}
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

interface ICustomFieldStateOptionsEditorProps {
    customField: CustomFieldT;
}

const CustomFieldStateOptionsEditor: FC<
    ICustomFieldStateOptionsEditorProps
> = ({ customField }) => {
    const { t } = useTranslation();

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<EnumOptionT | null>(
        null,
    );

    const [createOption, { isLoading: createLoading }] =
        customFieldsApi.useCreateCustomFieldStateOptionMutation();
    const [deleteOption, { isLoading: deleteLoading }] =
        customFieldsApi.useDeleteCustomFieldStateOptionMutation();

    const handleClickAddOption = () => {
        createOption({
            id: customField.id,
            value: "",
            color: null,
            is_resolved: false,
            is_closed: false,
        })
            .unwrap()
            .then()
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
                <CustomFieldStateOption
                    key={option.uuid}
                    customFieldId={customField.id}
                    option={option as StateOptionT}
                    onDelete={handleClickDeleteOption}
                />
            ))}

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
