import { TabContext } from "@mui/lab";
import { Box, debounce, Tab, Tabs } from "@mui/material";
import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { AgileBoardT } from "shared/model/types";
import { TabPanel } from "shared/ui";
import { Access } from "./tabs/access";
import { Card } from "./tabs/card";
import { ColumnSwimlanes } from "./tabs/column_swimlanes";
import { MainInfo } from "./tabs/main_info";

interface IAgileBoardFormProps {
    board: AgileBoardT;
    onSubmit: (formData: AgileBoardT) => void;
}

const enum tabs {
    main = "main",
    column_and_swim_lines = "column_and_swim_lines",
    card = "card",
    access = "access",
}

const AgileBoardForm: FC<IAgileBoardFormProps> = ({ board, onSubmit }) => {
    const { t } = useTranslation();
    const [currentTab, setTab] = useState<tabs>(tabs.main);

    const form = useForm<AgileBoardT>();

    const {
        handleSubmit,
        formState: { dirtyFields },
        control,
        reset,
    } = form;

    useEffect(() => {
        reset(board);
    }, [board, reset]);

    const fieldValues = useWatch({ control });

    const debouncedSubmit = useMemo(
        () => debounce(handleSubmit(onSubmit), 400),
        [handleSubmit, onSubmit],
    );

    useEffect(() => {
        if (Object.keys(dirtyFields).length) {
            debouncedSubmit();
        }
    }, [debouncedSubmit, dirtyFields, fieldValues]);

    const isBoardViewer = board.current_permission === "view";
    const isBoardAdmin = board.current_permission === "admin";

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
                                    "agileBoardForm.tab.columnAndSwimLanes",
                                )}
                                value={tabs.column_and_swim_lines}
                            />
                            <Tab
                                label={t("agileBoardForm.tab.card")}
                                value={tabs.card}
                            />
                            {isBoardAdmin && (
                                <Tab
                                    label={t("agileBoardForm.tab.access")}
                                    value={tabs.access}
                                />
                            )}
                        </Tabs>
                    </Box>

                    <TabPanel value={tabs.main}>
                        <MainInfo readOnly={isBoardViewer} />
                    </TabPanel>

                    <TabPanel value={tabs.column_and_swim_lines}>
                        <ColumnSwimlanes controlsDisabled={isBoardViewer} />
                    </TabPanel>

                    <TabPanel value={tabs.card}>
                        <Card controlsDisabled={isBoardViewer} />
                    </TabPanel>

                    {isBoardAdmin && (
                        <TabPanel value={tabs.access}>
                            <Access />
                        </TabPanel>
                    )}
                </Box>
            </TabContext>
        </FormProvider>
    );
};

export { AgileBoardForm };
