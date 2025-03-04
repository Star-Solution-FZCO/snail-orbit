import AddIcon from "@mui/icons-material/Add";
import { Box, Button, Stack, Typography } from "@mui/material";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { CustomFieldT } from "types";

const FieldItem: FC<{
    field: CustomFieldT;
    onClick: (fieldId: string) => void;
    selected: boolean;
}> = ({ field, onClick, selected }) => {
    return (
        <Box
            key={field.id}
            sx={(theme) => ({
                cursor: "pointer",
                width: 1,
                px: 1,
                py: 0.5,
                backgroundColor: selected ? "action.hover" : "transparent",
                boxShadow: selected
                    ? `inset 2px 0 ${theme.palette.primary.main}`
                    : "none",
                "&:hover": {
                    backgroundColor: "action.hover",
                },
            })}
            onClick={() => onClick(field.id)}
        >
            {field.label}
        </Box>
    );
};

export const FieldList: FC<{
    fields: CustomFieldT[];
    selectedFieldId: string | null;
    onFieldClick: (customFieldId: string) => void;
    onClickAdd: () => void;
}> = ({ fields, selectedFieldId, onFieldClick, onClickAdd }) => {
    const { t } = useTranslation();

    return (
        <Stack spacing={1}>
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
            >
                <Typography fontSize={20} fontWeight="bold" lineHeight={1.8}>
                    {t("customFields.fields")}
                </Typography>

                <Button
                    onClick={onClickAdd}
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                >
                    {t("customFields.fields.add")}
                </Button>
            </Box>

            <Stack spacing={1} alignItems="flex-start">
                {fields.map((field) => (
                    <FieldItem
                        key={field.id}
                        field={field}
                        onClick={onFieldClick}
                        selected={selectedFieldId === field.id}
                    />
                ))}
            </Stack>
        </Stack>
    );
};
