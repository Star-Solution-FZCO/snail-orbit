import { Kanban as KanbanComp } from "components/kanban/kanban";
import { Items, KanbanProps } from "components/kanban/kanban.types";
import { FC, useCallback, useEffect, useState } from "react";
import { agileBoardApi, issueApi } from "store";
import { AgileBoardT, IssueT, UpdateIssueT } from "types";
import { toastApiError } from "utils";
import {
    columnKeyToFieldValue,
    fieldValueToColumnKey,
    fieldValueToSwimlaneKey,
    swimlaneKeyToFieldValue,
} from "../utils/fieldValueToKey";
import { normalizeFieldValue } from "../utils/normalizeFieldValue";
import { useCalcColumns } from "../utils/useCalcColumns";
import { AgileCard } from "./agile_card";

export type AgileBoardProps = {
    boardData: AgileBoardT;
    query?: string;
    onCardDoubleClick?: (issue: IssueT) => void;
};

export const AgileBoard: FC<AgileBoardProps> = ({
    boardData,
    query,
    onCardDoubleClick,
}) => {
    const { data, refetch, isFetching } = agileBoardApi.useGetBoardIssuesQuery({
        boardId: boardData.id,
        q: query,
    });

    const [moveIssue] = agileBoardApi.useMoveIssueMutation();
    const [updateIssue] = issueApi.useUpdateIssueMutation();

    const handleUpdateIssue = useCallback(
        async (issueId: string, formData: UpdateIssueT) => {
            await updateIssue({ ...formData, id: issueId })
                .unwrap()
                .then(refetch)
                .catch(toastApiError);
        },
        [],
    );

    const [items, setItems] = useState<Items | null>(null);
    const [itemsMap, setItemsMap] = useState<Record<string, IssueT>>({});
    const [headers, setHeaders] = useState<string[]>([]);

    // We use useEffect instead of useMemo here to be able to await for fetching to complete
    useEffect(() => {
        if (!data || !data.payload) return setItems(null);
        if (isFetching) return;
        const res: Items = {};
        for (const swimlane of data.payload.items) {
            const normalizedSwimLane = swimlane.field_value
                ? (normalizeFieldValue(swimlane.field_value) as {
                      value: string | null | undefined;
                  })
                : undefined;
            const swimlaneKey = fieldValueToSwimlaneKey(
                normalizedSwimLane?.value,
            );
            res[swimlaneKey] = {};
            for (const column of swimlane.columns) {
                const normalizedColumn = column.field_value
                    ? (normalizeFieldValue(column.field_value) as {
                          value: string | null | undefined;
                      })
                    : undefined;
                const columnKey = fieldValueToColumnKey(
                    normalizedSwimLane?.value,
                    normalizedColumn?.value || "",
                );
                res[swimlaneKey][columnKey] = column.issues.map((el) => el.id);
            }
        }

        setItems(res);
    }, [data?.payload, isFetching]);

    useEffect(() => {
        if (!data?.payload) return setItemsMap({});
        if (isFetching) return;
        const allItems = data.payload.items
            .flatMap((el) => el.columns)
            .flatMap((el) => el.issues);
        const map = allItems.reduce(
            (prev, cur) => {
                prev[cur.id] = cur;
                return prev;
            },
            {} as Record<string, IssueT>,
        );
        setItemsMap(map);
    }, [data?.payload, isFetching]);

    useEffect(() => {
        setHeaders(
            data?.payload.items?.length
                ? data.payload.items[0].columns.map((el) =>
                      el.field_value
                          ? String(normalizeFieldValue(el.field_value).value)
                          : "",
                  )
                : [],
        );
    }, [data?.payload]);

    useEffect(() => {
        refetch();
    }, [boardData]);

    const columns = useCalcColumns({
        boardColumns: headers.length,
        strategy: boardData.ui_settings.columnsStrategy,
        value:
            boardData.ui_settings.columnsStrategy === "column"
                ? boardData.ui_settings.columns || 1
                : boardData.ui_settings.columnMaxWidth || 120,
    });

    const handleCardMoved: KanbanProps["onCardMoved"] = (id, _from, to) => {
        moveIssue({
            issue_id: id.toString(),
            board_id: boardData.id,
            column: columnKeyToFieldValue(to.column),
            swimlane: swimlaneKeyToFieldValue(to.swimLine) || undefined,
            after_issue: to.after?.toString() || null,
        });
    };

    if (!items) return null;

    return (
        <div>
            <KanbanComp
                headers={headers}
                items={items}
                columns={columns}
                renderItemContent={
                    ({ id }) =>
                        itemsMap[id] ? (
                            <AgileCard
                                issue={itemsMap[id]}
                                cardSetting={boardData.ui_settings}
                                cardFields={boardData.card_fields}
                                onUpdateIssue={handleUpdateIssue}
                                cardColorFields={boardData.card_colors_fields}
                                onDoubleClick={() =>
                                    onCardDoubleClick?.(itemsMap[id])
                                }
                            />
                        ) : null // TODO: Move and preserve issue data inside kanban
                }
                swimLineProps={(swimlaneId) => ({
                    hideHandle: true,
                    label: swimlaneId.toString(),
                })}
                containerProps={{ hideHandle: true, label: "" }}
                onCardMoved={handleCardMoved}
            />
        </div>
    );
};
