import { Kanban as KanbanComp } from "components/kanban/kanban";
import { Items, KanbanProps } from "components/kanban/kanban.types";
import { FC, useEffect, useState } from "react";
import { agileBoardApi } from "store";
import { AgileBoardT, IssueT } from "types";
import { fieldKeyToValue, fieldValueToKey } from "../utils/fieldValueToKey";
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

    // We use useEffect instead of useMemo here to be able to await for fetching to complete
    useEffect(() => {
        if (!data || !data.payload) return setItems(null);
        if (isFetching) return;
        const res: Items = {};
        for (const swimLine of data.payload.items) {
            const swimLineKey = fieldValueToKey(swimLine?.field_value?.value);
            res[swimLineKey] = {};
            for (const column of swimLine.columns) {
                const columnKey = fieldValueToKey(column?.field_value?.value);
                res[swimLineKey][columnKey] = column.issues.map((el) => el.id);
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
        refetch();
    }, [boardData]);

    const handleCardMoved: KanbanProps["onCardMoved"] = (id, _from, to) => {
        moveIssue({
            issue_id: id.toString(),
            board_id: boardData.id,
            column: fieldKeyToValue(to.column),
            swimline: fieldKeyToValue(to.swimLine),
            after_issue: fieldKeyToValue(to.after),
        });
    };

    if (!items) return null;

    return (
        <div>
            <KanbanComp
                items={items}
                renderItemContent={(args) =>
                    itemsMap[args.id] ? (
                        <IssueCard {...args} issue={itemsMap[args.id]} />
                    ) : null // TODO: Move and preserve issue data inside kanban
                }
                swimLineProps={{ hideHandle: true, label: "All tasks" }}
                containerProps={{ hideHandle: true, label: "" }}
                onCardMoved={handleCardMoved}
            />
        </div>
    );
};
