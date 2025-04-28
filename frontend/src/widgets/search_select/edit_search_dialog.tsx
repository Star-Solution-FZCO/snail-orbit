import { TabContext, TabPanel } from "@mui/lab";
import { Button, Dialog, DialogActions, Stack, Tab, Tabs } from "@mui/material";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { SearchFormValuesT } from "shared/model/types/search";
import Access from "./tabs/access";
import Main from "./tabs/main";

const enum tabs {
    main = "main",
    access = "access",
}

export type EditSearchDialogValues = SearchFormValuesT;

type EditSearchDialogProps = {
    open: boolean;
    onSubmit: (data: EditSearchDialogValues) => unknown;
    onClose?: () => unknown;
    onDelete?: (data: EditSearchDialogValues) => unknown;
    loading?: boolean;
    defaultValues?: EditSearchDialogValues;
};

export const EditSearchDialog = (props: EditSearchDialogProps) => {
    const { open, onClose, loading, defaultValues, onSubmit, onDelete } = props;
    const [currentTab, setTab] = useState<tabs>(tabs.main);

    const { t } = useTranslation();

    const form = useForm<EditSearchDialogValues>({
        defaultValues,
    });

    const { reset, handleSubmit } = form;

    useEffect(() => {
        if (open) {
            reset(defaultValues);
            setTab(tabs.main);
        }
    }, [defaultValues, reset, open]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            disableRestoreFocus
        >
            <FormProvider {...form}>
                <TabContext value={currentTab}>
                    <Tabs
                        value={currentTab}
                        onChange={(_, value) => setTab(value)}
                    >
                        <Tab
                            label={t("editSearchDialog.tab.main")}
                            value={tabs.main}
                        />
                        <Tab
                            label={t("editSearchDialog.tab.access")}
                            value={tabs.access}
                        />
                    </Tabs>
                    <TabPanel value={tabs.main}>
                        <Main />
                    </TabPanel>
                    <TabPanel value={tabs.access} sx={{ padding: 1 }}>
                        <Access />
                    </TabPanel>
                </TabContext>
            </FormProvider>
            <DialogActions
                sx={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    flexDirection: "row",
                }}
            >
                <div>
                    {defaultValues?.id ? (
                        <Button
                            color="error"
                            onClick={() => onDelete?.(defaultValues)}
                        >
                            {t("delete")}
                        </Button>
                    ) : null}
                </div>
                <Stack direction="row" gap={1}>
                    <Button type="button" variant="text" onClick={onClose}>
                        {t("cancel")}
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        loading={loading}
                        disabled={loading}
                    >
                        {t("save")}
                    </Button>
                </Stack>
            </DialogActions>
        </Dialog>
    );
};
