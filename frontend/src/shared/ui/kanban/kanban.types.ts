import type { ComponentType, ReactNode } from "react";

export type UniqueIdentifier = string | number;

export type KanbanItems<I> = Array<Array<Array<I>>>;

export type ItemData = {
    itemIndex?: number;
    columnIndex: number;
    swimLaneIndex: number;
};

export type ColumnArg<C> = { type: "column"; value: C };
export type SwimLaneArg<S> = { type: "swimLane"; value: S };
export type ItemArg<I> = { type: "item"; value: I };

export const enum KanbanCollisionDetection {
    Default,
    PointerIntersection,
    ShapeIntersection,
}

type ItemContentProps<P> = Omit<P, "issue">;

export type KanbanOnCardMoved<I, S, C> = (
    item: I,
    from: {
        column: C;
        swimLane: S;
        after: I | null;
    },
    to: {
        column: C;
        swimLane: S;
        after: I | null;
    },
) => Promise<boolean | undefined> | boolean | undefined | void;

export type KanbanProps<I, S, C, P> = {
    columns: C[];
    swimLanes: S[];
    items: KanbanItems<I>;
    getLabel: (data: ColumnArg<C> | SwimLaneArg<S>) => ReactNode;
    getIsClosed?: (data: ColumnArg<C> | SwimLaneArg<S>) => boolean;
    getKey: (
        data: ColumnArg<C> | SwimLaneArg<S> | ItemArg<I>,
    ) => UniqueIdentifier;
    onClosedChange?: (
        data: ColumnArg<C> | SwimLaneArg<S>,
        value: boolean,
    ) => void;
    inBlockColumns?: number;
    ItemContent?: ComponentType<
        {
            issue: I;
            onDoubleClick?: (issue: I) => unknown;
        } & ItemContentProps<P>
    >;
    itemProps?: ItemContentProps<P>;
    collisionDetection?: KanbanCollisionDetection;
    onCardMoved?: KanbanOnCardMoved<I, S, C>;
    onCardDoubleClicked?: (issue: I) => unknown;
};
