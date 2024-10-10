import { Kanban as KanbanComp } from "components/kanban/kanban";
import { Items, KanbanProps } from "components/kanban/kanban.types";
import { FC, useEffect, useMemo } from "react";
import { agileBoardApi } from "store";
import { AgileBoardT, IssueT } from "types";
import { fieldKeyToValue, fieldValueToKey } from "../utils/fieldValueToKey";
import { IssueCard } from "./issue_card";

export type AgileBoardProps = {
    boardData: AgileBoardT;
};

export const AgileBoard: FC<AgileBoardProps> = ({ boardData }) => {
    const {
        currentData: data,
        refetch,
        requestId,
    } = agileBoardApi.useGetBoardIssuesQuery({
        boardId: boardData.id,
    });

    const [moveIssue] = agileBoardApi.useMoveIssueMutation();

    const items: Items | null = useMemo(() => {
        if (!data || !data.payload) return null;
        const res: Items = {};
        for (const swimLine of data.payload.items) {
            const swimLineKey = fieldValueToKey(swimLine.field_value);
            res[swimLineKey] = {};
            for (const column of swimLine.columns) {
                const columnKey = fieldValueToKey(column.field_value);
                res[swimLineKey][columnKey] = column.issues.map((el) => el.id);
            }
        }

        return res;
    }, [data?.payload, requestId]);

    const itemsMap: Record<string, IssueT> = useMemo(() => {
        if (!data?.payload) return {};
        const allItems = data.payload.items
            .flatMap((el) => el.columns)
            .flatMap((el) => el.issues);
        return allItems.reduce(
            (prev, cur) => {
                prev[cur.id] = cur;
                return prev;
            },
            {} as Record<string, IssueT>,
        );
    }, [data?.payload, requestId]);

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
                renderItemContent={(args) => (
                    <IssueCard {...args} issue={itemsMap[args.id]} /> // TODO: Move and preserve issue data inside kanban
                )}
                swimLineProps={{ hideHandle: true, label: "All tasks" }}
                containerProps={{ hideHandle: true, label: "" }}
                onCardMoved={handleCardMoved}
            />
        </div>
    );
};
