import { TabContext, TabPanel } from "@mui/lab";
import { Box, debounce, Tab, Tabs } from "@mui/material";
import type { ReportFormValues } from "modules/reports/components/report_form/report_form.types";
import { ReportFormAccess } from "modules/reports/components/report_form/report_form_access";
import { ReportFormMainInfo } from "modules/reports/components/report_form/report_form_main_info";
import { reportFormValuesToEditFormValues } from "modules/reports/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { reportApi } from "shared/model";
import type { ReportT } from "shared/model/types/report";
import { isAdmin } from "shared/utils/permissions/checks";

type ReportEditSection = {
    report: ReportT;
    onSubmit?: (data: ReportT) => unknown;
};

const enum tabs {
    main = "main",
    access = "access",
}

export const ReportEditSection = (props: ReportEditSection) => {
    const { report } = props;
    const { t } = useTranslation();

    const [currentTab, setTab] = useState(tabs.main);

    const [updateReport] = reportApi.useUpdateReportMutation();

    const form = useForm<ReportFormValues>();

    const { reset, handleSubmit, control, formState } = form;
    const { dirtyFields } = formState;

    const onSubmit = useCallback(
        (values: ReportFormValues) => {
            updateReport({
                ...reportFormValuesToEditFormValues(values),
                id: report.id,
            });
        },
        [report.id, updateReport],
    );

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

    useEffect(() => {
        reset(report);
    }, [reset, report]);

    const isReportAdmin = isAdmin(report.current_permission);

    return (
        <FormProvider {...form}>
            <TabContext value={currentTab}>
                <Box component="form">
                    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                        <Tabs
                            value={currentTab}
                            onChange={(_, value) => setTab(value)}
                        >
                            <Tab
                                label={t("reportEditSection.tab.main")}
                                value={tabs.main}
                            />
                            {isReportAdmin && (
                                <Tab
                                    label={t("reportEditSection.tab.access")}
                                    value={tabs.access}
                                />
                            )}
                        </Tabs>
                    </Box>
                    <TabPanel value={tabs.main}>
                        <ReportFormMainInfo />
                    </TabPanel>
                    <TabPanel value={tabs.access}>
                        <ReportFormAccess />
                    </TabPanel>
                </Box>
            </TabContext>
        </FormProvider>
    );
};
