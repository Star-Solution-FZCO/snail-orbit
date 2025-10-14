import type { ReportDataT } from "shared/model/types/report";
import { formatSpentTime } from "shared/utils";

export const formatAxisValues = (
    axis: ReportDataT["axis_1"],
): { id: string; label: string }[] => {
    if (!axis || !axis.values.length) return [{ id: "TEMP", label: "" }];
    switch (axis.type) {
        case "boolean":
            return axis.values.map((el) => ({
                id: el ? "True" : "False",
                label: el ? "True" : "False",
            }));
        case "float":
        case "integer":
        case "string":
        case "date":
        case "datetime":
            return axis.values.map((el, idx) => ({
                id: el?.toString() || idx.toString(),
                label: el?.toString() || "",
            }));
        case "duration":
            return axis.values.map((el, idx) => ({
                id: el?.toString() || idx.toString(),
                label: el ? formatSpentTime(el) : "",
            }));
        case "project":
        case "user_multi":
        case "user":
            return axis.values.map((el, idx) => ({
                id: el?.id || idx.toString(),
                label: el?.name || "",
            }));
        case "version_multi":
        case "owned_multi":
        case "enum_multi":
        case "sprint_multi":
        case "version":
        case "state":
        case "owned":
        case "enum":
        case "sprint":
            return axis.values.map((el, idx) => ({
                id: el.value || idx.toString(),
                label: el.value || "",
            }));
    }
};
