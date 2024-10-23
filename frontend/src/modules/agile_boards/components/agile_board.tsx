import { Kanban as KanbanComp } from "components/kanban/kanban";
import { Items, KanbanProps } from "components/kanban/kanban.types";
import { FC, useEffect, useState } from "react";
import { agileBoardApi } from "store";
import { AgileBoardT, IssueT } from "types";
import {
    columnKeyToFieldValue,
    fieldValueToColumnKey,
    fieldValueToSwimlaneKey,
    swimlaneKeyToFieldValue,
} from "../utils/fieldValueToKey";
import { IssueCard } from "./issue_card";

export type AgileBoardProps = {
    boardData: AgileBoardT;
};

export const AgileBoard: FC<AgileBoardProps> = ({ boardData }) => {
    const { data, refetch, isFetching } = agileBoardApi.useGetBoardIssuesQuery({
        boardId: boardData.id,
    });

    const [moveIssue] = agileBoardApi.useMoveIssueMutation();

    const [items, setItems] = useState<Items | null>(null);
    const [itemsMap, setItemsMap] = useState<Record<string, IssueT>>({});
    const [headers, setHeaders] = useState<string[]>([]);

    // We use useEffect instead of useMemo here to be able to await for fetching to complete
    useEffect(() => {
        if (!data || !data.payload) return setItems(null);
        if (isFetching) return;
        const res: Items = {};
        for (const swimlane of data.payload.items) {
            const swimlaneKey = fieldValueToSwimlaneKey(
                swimlane?.field_value?.value,
            );
            res[swimlaneKey] = {};
            for (const column of swimlane.columns) {
                const columnKey = fieldValueToColumnKey(
                    swimlane?.field_value?.value,
                    column?.field_value?.value || "",
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
            data?.payload.items[0].columns.map(
                (el) => el.field_value?.value || "",
            ) || [],
        );
    }, [data?.payload]);

    useEffect(() => {
        refetch();
    }, [boardData]);

    const handleCardMoved: KanbanProps["onCardMoved"] = (id, _from, to) => {
        moveIssue({
            issue_id: id.toString(),
            board_id: boardData.id,
            column: columnKeyToFieldValue(to.column),
            swimlane: swimlaneKeyToFieldValue(to.swimLine),
            after_issue: to.after?.toString() || null,
        });
    };

    if (!items) return null;

    return (
        <div>
            <KanbanComp
                headers={headers}
                items={items}
                renderItemContent={
                    (args) =>
                        itemsMap[args.id] ? (
                            <IssueCard {...args} issue={itemsMap[args.id]} />
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
