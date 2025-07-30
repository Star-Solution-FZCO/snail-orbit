import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { BoardIssuesT, IssueT } from "shared/model/types";
import type {
    ColumnArg,
    ItemArg,
    SwimLaneArg,
} from "shared/ui/kanban/kanban.types";
import { notEmpty } from "shared/utils/helpers/notEmpty";

export type BoardEntry = {
    label: string;
    id: string;
    value: string | number | boolean;
};

export const defaultSwimLaneId = "__DEFAULT__";

const formatColumn = (columnData: BoardIssuesT["columns"]): BoardEntry[] => {
    return columnData.values
        .filter(notEmpty)
        .map(({ id, value }) => ({ id, value, label: value }));
};

const formatSwimLane = (
    swimLaneData: NonNullable<BoardIssuesT["swimlanes"]>,
): BoardEntry[] => {
    switch (swimLaneData.type) {
        case "version":
        case "enum":
        case "state":
            return swimLaneData.values
                .filter(notEmpty)
                .map(({ id, value }) => ({ id, value, label: value }));
        case "date":
        case "datetime":
            return swimLaneData.values
                .filter(notEmpty)
                .map((date) => ({ id: date, value: date, label: date }));
        case "integer":
        case "float":
        case "string":
            return swimLaneData.values
                .filter(notEmpty)
                .map((number) => number.toString())
                .map((number) => ({
                    id: number,
                    value: number,
                    label: number,
                }));
        case "user":
            return swimLaneData.values
                .filter(notEmpty)
                .map(({ id, name }) => ({ id, value: id, label: name }));
        case "boolean":
            return swimLaneData.values.filter(notEmpty).map((value) => ({
                id: value ? "+" : "-",
                value,
                label: value ? "True" : "False",
            }));
    }
};

export const getLabel = (el: ColumnArg<BoardEntry> | SwimLaneArg<BoardEntry>) =>
    el.value.label;
export const getKey = (
    el: ColumnArg<BoardEntry> | SwimLaneArg<BoardEntry> | ItemArg<IssueT>,
) => el.value.id;

export const useFormatBoardIssues = (data?: BoardIssuesT | null) => {
    const { t } = useTranslation();

    return useMemo(() => {
        if (!data) return null;

        const columns = formatColumn(data.columns);
        const swimLanes = data.swimlanes
            ? formatSwimLane(data.swimlanes)
            : [
                  {
                      id: defaultSwimLaneId,
                      value: defaultSwimLaneId,
                      label: t("swimlanes.defaultSwimlane"),
                  },
              ];
        const issues = data.issues;

        return { columns, swimLanes, issues };
    }, [data, t]);
};
