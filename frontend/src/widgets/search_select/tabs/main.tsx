import { Stack, TextField } from "@mui/material";
import { memo } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { SearchFormValuesT } from "shared/model/types/search";

export const Main = memo(() => {
    const { t } = useTranslation();
    const { register } = useFormContext<SearchFormValuesT>();

    return (
        <Stack direction="column" gap={2}>
            <TextField
                {...register("name")}
                fullWidth
                size="small"
                label={t("editSearchDialog.label.name")}
                autoFocus
            />
            <TextField
                {...register("description")}
                fullWidth
                size="small"
                label={t("editSearchDialog.label.description")}
            />
            <TextField
                {...register("query")}
                fullWidth
                size="small"
                label={t("editSearchDialog.label.query")}
            />
        </Stack>
    );
});

Main.displayName = "Main";

export default Main;
