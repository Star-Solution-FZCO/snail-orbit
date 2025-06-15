import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";
import { agileBoardApi } from "shared/model";
import type { AgileBoardT, IssueT } from "shared/model/types";
import { Kanban as KanbanComp } from "shared/ui/kanban/kanban";
import type {
    ColumnArg,
    KanbanProps,
    SwimLaneArg,
} from "shared/ui/kanban/kanban.types";
import { toastApiError } from "../../../shared/utils";
import { useCalcColumns } from "../utils/useCalcColumns";
import type { BoardEntry } from "../utils/useFormatBoardIssues";
import {
    defaultSwimLaneId,
    getKey,
    getLabel,
    useFormatBoardIssues,
} from "../utils/useFormatBoardIssues";
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
    const [closedSet, setClosedSet] = useState<Record<string, boolean>>({});

    const { data, refetch } = agileBoardApi.useGetBoardIssuesQuery({
        boardId: boardData.id,
        q: query,
    });

    const [moveIssue] = agileBoardApi.useMoveIssueMutation();

    useEffect(() => {
        refetch();
    }, [boardData, refetch]);

    const handleCardMoved: KanbanProps<
        IssueT,
        BoardEntry,
        BoardEntry
    >["onCardMoved"] = (issue, _from, to) => {
        moveIssue({
            issue_id: issue.id.toString(),
            board_id: boardData.id,
            column: to.column.value.toString(),
            swimlane:
                to.swimLane === undefined ||
                to.swimLane.value === defaultSwimLaneId
                    ? undefined
                    : to.swimLane.value.toString(),
            after_issue: to.after?.id.toString() || null,
        })
            .unwrap()
            .catch(toastApiError);
    };

    const inBlockColumns = useCalcColumns({
        boardColumns: boardData.columns.values.length,
        strategy: boardData.ui_settings.columnsStrategy,
        value:
            boardData.ui_settings.columnsStrategy === "column"
                ? boardData.ui_settings.columns || 1
                : boardData.ui_settings.columnMaxWidth || 120,
    });

    const formatedBoardIssues = useFormatBoardIssues(data?.payload);

    const AgileCardComponent = useCallback(
        ({ data }: { data: IssueT }) => (
            <AgileCard
                issue={data}
                cardSetting={boardData.ui_settings}
                cardFields={boardData.card_fields}
                cardColorFields={boardData.card_colors_fields}
                onDoubleClick={() => onCardDoubleClick?.(data)}
            />
        ),
        [boardData, onCardDoubleClick],
    );

    const handleIsClosed = useCallback(
        (data: ColumnArg<BoardEntry> | SwimLaneArg<BoardEntry>) =>
            !!closedSet[data.type + "-" + data.value.id],
        [closedSet],
    );

    const handleClose = useCallback(
        (
            data: ColumnArg<BoardEntry> | SwimLaneArg<BoardEntry>,
            value: boolean,
        ) => {
            setClosedSet((prev) => ({
                ...prev,
                [data.type + "-" + data.value.id]: value,
            }));
        },
        [],
    );

    if (!formatedBoardIssues) return null;

    const { issues, columns, swimLanes } = formatedBoardIssues;

    return (
        <KanbanComp<IssueT, BoardEntry, BoardEntry>
            items={issues}
            columns={columns}
            swimLanes={swimLanes}
            getLabel={getLabel}
            getKey={getKey}
            ItemContent={AgileCardComponent}
            onCardMoved={handleCardMoved}
            inBlockColumns={inBlockColumns}
            getIsClosed={handleIsClosed}
            onClosedChange={handleClose}
        />
    );
};
