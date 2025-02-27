import AddIcon from "@mui/icons-material/Add";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Link } from "components";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { CustomFieldT } from "types";

export const FieldList: FC<{ gid: string; fields: CustomFieldT[] }> = ({
    gid,
    fields,
}) => {
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

                <Link
                    to="/custom-fields/$customFieldGroupId/fields/add"
                    params={{
                        customFieldGroupId: gid,
                    }}
                >
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                    >
                        {t("customFields.fields.add")}
                    </Button>
                </Link>
            </Box>

            <Stack spacing={1} alignItems="flex-start">
                {fields.map((field) => (
                    <Link
                        key={field.id}
                        to={`/custom-fields/${gid}/fields/${field.id}`}
                        underline="hover"
                    >
                        {field.label}
                    </Link>
                ))}
            </Stack>
        </Stack>
    );
};
