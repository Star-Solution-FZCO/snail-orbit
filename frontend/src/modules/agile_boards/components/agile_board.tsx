import { FC, useEffect, useMemo } from "react";
import { Kanban as KanbanComp } from "../../../components/kanban/kanban";
import { Items, KanbanProps } from "../../../components/kanban/kanban.types";
import { agileBoardApi } from "../../../store";
import { AgileBoardT } from "../../../types";
import { fieldKeyToValue, fieldValueToKey } from "../utils/fieldValueToKey";

export type AgileBoardProps = {
    boardData: AgileBoardT;
};

export const AgileBoard: FC<AgileBoardProps> = ({ boardData }) => {
    const { data, refetch } = agileBoardApi.useGetBoardIssuesQuery({
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
    }, [data?.payload]);

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
                renderItemContent={({ id }) => id}
                swimLineProps={{ hideHandle: true, label: "All tasks" }}
                containerProps={{ hideHandle: true, label: "" }}
                onCardMoved={handleCardMoved}
            />
        </div>
    );
};
