import AddIcon from "@mui/icons-material/Add";
import { Box, Button, Stack, Typography } from "@mui/material";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import type { CustomFieldT } from "shared/model/types";

const FieldItem: FC<{
    field: CustomFieldT;
    onClick: (fieldId: string) => void;
    selected: boolean;
}> = ({ field, onClick, selected }) => {
    const { t } = useTranslation();

    const usedInCount = field.projects.length;

    return (
        <Box
            key={field.id}
            sx={(theme) => ({
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1,
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
                fontSize: 14,
            })}
            onClick={() => onClick(field.id)}
        >
            <Typography fontSize="inherit">{field.label}</Typography>

            <Typography fontSize="inherit" color="textSecondary">
                {usedInCount === 1
                    ? t("customFields.fields.usedInProject", {
                          project: field.projects[0].name,
                      })
                    : t("customFields.fields.usedInProjects", {
                          count: field.projects.length,
                      })}
            </Typography>
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
                    {t("customFields.bundles")}
                </Typography>

                <Button
                    onClick={onClickAdd}
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                >
                    {t("customFields.bundles.add")}
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
