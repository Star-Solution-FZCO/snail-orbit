import { yupResolver } from "@hookform/resolvers/yup";
import { TabContext } from "@mui/lab";
import { Box, debounce, Tab, Tabs } from "@mui/material";
import { TabPanel } from "components";
import { FC, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSchema } from "utils/hooks/use-schema";
import {
    AgileBoardFormData,
    getAgileBoardSchema,
} from "./agile_board_form.schema";
import { Card } from "./tabs/card";
import { ColumnSwimlanes } from "./tabs/column_swimlanes";
import { MainInfo } from "./tabs/main_info";

interface IAgileBoardFormProps {
    defaultValues?: AgileBoardFormData;
    onSubmit: (formData: AgileBoardFormData) => void;
}

const enum tabs {
    main = "main",
    column_and_swim_lines = "column_and_swim_lines",
    card = "card",
}

const AgileBoardForm: FC<IAgileBoardFormProps> = ({
    defaultValues,
    onSubmit,
}) => {
    const { t } = useTranslation();
    const agileBoardSchema = useSchema(getAgileBoardSchema);
    const [currentTab, setTab] = useState<tabs>(tabs.main);

    const form = useForm<AgileBoardFormData>({
        defaultValues,
        resolver: yupResolver(agileBoardSchema),
    });

    const {
        handleSubmit,
        formState: { isDirty },
        control,
        reset,
    } = form;

    useEffect(() => {
        reset(defaultValues);
    }, [defaultValues]);

    const fieldValues = useWatch({ control });

    const debouncedSubmit = useMemo(
        () => debounce(handleSubmit(onSubmit), 400),
        [onSubmit, handleSubmit],
    );

    useEffect(() => {
        if (isDirty) debouncedSubmit();
    }, [fieldValues, isDirty]);

    return (
        <FormProvider {...form}>
            <TabContext value={currentTab}>
                <Box
                    component="form"
                    display="flex"
                    flexDirection="column"
                    gap={2}
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                        <Tabs
                            value={currentTab}
                            onChange={(_, value) => setTab(value)}
                        >
                            <Tab
                                label={t("agileBoardForm.tab.main")}
                                value={tabs.main}
                            />
                            <Tab
                                label={t(
                                    "agileBoardForm.tab.columnAndSwimLines",
                                )}
                                value={tabs.column_and_swim_lines}
                            />
                            <Tab
                                label={t("agileBoardForm.tab.card")}
                                value={tabs.card}
                            />
                        </Tabs>
                    </Box>
                    <TabPanel value={tabs.main}>
                        <MainInfo />
                    </TabPanel>
                    <TabPanel value={tabs.column_and_swim_lines}>
                        <ColumnSwimlanes />
                    </TabPanel>
                    <TabPanel value={tabs.card}>
                        <Card />
                    </TabPanel>
                </Box>
            </TabContext>
        </FormProvider>
    );
};

export { AgileBoardForm };
