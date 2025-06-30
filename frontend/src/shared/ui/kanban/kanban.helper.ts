import {
    defaultCollisionDetection,
    pointerIntersection,
    shapeIntersection,
} from "@dnd-kit/collision";
import {
    type DragDropEventHandlers,
    KeyboardSensor,
    PointerSensor,
} from "@dnd-kit/react";
import type { ItemData, KanbanItems } from "./kanban.types";
import { KanbanCollisionDetection } from "./kanban.types";

export const sensors = [
    PointerSensor.configure({
        activationConstraints: {
            distance: {
                value: 5,
            },
            delay: {
                value: 200,
                tolerance: 10,
            },
        },
    }),
    KeyboardSensor,
];

export const makeCopy = <I>(data: KanbanItems<I>): KanbanItems<I> => {
    return data.map((swimlane) =>
        swimlane.map((column) => column.map((item) => item)),
    );
};

export const getGroupId = (data: {
    columnIndex: number;
    swimLaneIndex: number;
}) => `${data.swimLaneIndex}#${data.columnIndex}`;

export const move = <I>(
    data: KanbanItems<I>,
    event: Parameters<
        DragDropEventHandlers["onDragOver"] | DragDropEventHandlers["onDragEnd"]
    >[0],
) => {
    const { source, target, canceled } = event.operation;

    if (!source || !target || canceled) {
        if ("preventDefault" in event) event.preventDefault();

        return data;
    }

    const sourceData = source.data as ItemData;
    const targetData = target.data as ItemData;

    if (sourceData.itemIndex === undefined) return data;

    const el =
        data[sourceData.swimLaneIndex][sourceData.columnIndex][
            sourceData.itemIndex
        ];
    if (!el) return data;

    const copy = makeCopy(data);
    const sourceParent = copy[sourceData.swimLaneIndex][sourceData.columnIndex];
    const targetParent = copy[targetData.swimLaneIndex][targetData.columnIndex];
    sourceParent.splice(sourceData.itemIndex, 1);
    if (targetData.itemIndex === undefined) targetParent.push(el);
    else targetParent.splice(targetData.itemIndex, 0, el);

    return copy;
};

export const getCollisionDetection = (val?: KanbanCollisionDetection) => {
    if (val === undefined) return defaultCollisionDetection;
    switch (val) {
        case KanbanCollisionDetection.PointerIntersection:
            return pointerIntersection;
        case KanbanCollisionDetection.ShapeIntersection:
            return shapeIntersection;
        case KanbanCollisionDetection.Default:
            return defaultCollisionDetection;
    }
};
