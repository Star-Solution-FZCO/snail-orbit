import { Stack, Typography } from "@mui/material";
import type { FC } from "react";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { agileBoardApi } from "shared/model";
import type { AgileBoardT, IssueT } from "shared/model/types";
import { Kanban as KanbanComp } from "shared/ui/kanban/kanban";
import type {
    ColumnArg,
    KanbanOnCardMoved,
    SwimLaneArg,
} from "shared/ui/kanban/kanban.types";
import { toastApiError } from "shared/utils";
import { useLSState } from "shared/utils/helpers/local-storage";
import { useCalcColumns } from "../utils/useCalcColumns";
import type { BoardEntry } from "../utils/useFormatBoardIssues";
import {
    defaultSwimLaneId,
    getKey,
    getLabel,
    useFormatBoardIssues,
} from "../utils/useFormatBoardIssues";
import { AgileBoardViewSettingsPopper } from "./agile_board_view_settings/agile_board_view_settings";
import type { AgileBoardViewSettings } from "./agile_board_view_settings/agile_board_view_settings.types";
import { defaultAgileBoardViewSettings } from "./agile_board_view_settings/agile_board_view_settings.types";
import type { IssueCardProps } from "./agile_card";
import { AgileCard } from "./agile_card";

export type AgileBoardProps = {
    boardData: AgileBoardT;
    query?: string;
    onCardDoubleClick?: (issue: IssueT) => void;
};

// TODO: Fully refactor: add proper null values support
export const AgileBoard: FC<AgileBoardProps> = ({
    boardData,
    query,
    onCardDoubleClick,
}) => {
    const { t } = useTranslation();

    const [closedSet, setClosedSet] = useLSState<Record<string, boolean>>(
        "AGILE_BOARD_CLOSED_STATE_" + boardData.id,
        {},
    );
    const [viewSettings, setViewSettings] = useLSState<AgileBoardViewSettings>(
        "AGILE_BOARD_VIEW_SETTINGS_" + boardData.id,
        defaultAgileBoardViewSettings,
    );

    const { data, refetch } = agileBoardApi.useGetBoardIssuesQuery(
        {
            boardId: boardData.id,
            q: query,
        },
        {
            refetchOnFocus: true,
        },
    );

    const [moveIssue] = agileBoardApi.useMoveIssueMutation();

    useEffect(() => {
        refetch();
    }, [boardData, refetch]);

    const handleCardMoved: KanbanOnCardMoved<IssueT, BoardEntry, BoardEntry> = (
        issue,
        _from,
        to,
    ) => {
        moveIssue({
            issue_id: issue.id.toString(),
            board_id: boardData.id,
            column: to.column.value?.toString() || null,
            swimlane:
                to.swimLane === undefined ||
                to.swimLane.value === defaultSwimLaneId
                    ? undefined
                    : to.swimLane.value?.toString() || null,
            after_issue: to.after?.id.toString() || null,
        })
            .unwrap()
            .catch((e) => {
                toastApiError(e);
                onCardDoubleClick?.(issue);
            });
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

    const totalCount = useMemo(() => {
        let res = 0;
        data?.payload.issues.forEach((swimlane) =>
            swimlane.forEach((column) => (res += column.length)),
        );

        return res;
    }, [data?.payload]);

    const cardProps: Omit<IssueCardProps, "issue"> = useMemo(
        () => ({
            cardSetting: {
                minCardHeight: boardData.ui_settings.minCardHeight,
                ...viewSettings,
            },
            cardFields: boardData.card_fields,
            cardColorFields: boardData.card_colors_fields,
        }),
        [boardData, viewSettings],
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
        <>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 4, pb: 1 }}
            >
                <Typography
                    fontSize={12}
                    color="textDisabled"
                    variant="subtitle2"
                >
                    {`${totalCount} ${t("issues.total")}`}
                </Typography>

                <AgileBoardViewSettingsPopper
                    value={viewSettings}
                    onChange={setViewSettings}
                />
            </Stack>
            <KanbanComp<IssueT, BoardEntry, BoardEntry, IssueCardProps>
                items={issues}
                columns={columns}
                swimLanes={swimLanes}
                getLabel={getLabel}
                getKey={getKey}
                ItemContent={AgileCard}
                itemProps={cardProps}
                onCardMoved={handleCardMoved}
                inBlockColumns={inBlockColumns}
                getIsClosed={handleIsClosed}
                onClosedChange={handleClose}
                collisionDetection={viewSettings.collisionDetectionStrategy}
                onCardDoubleClicked={onCardDoubleClick}
            />
        </>
    );
};
