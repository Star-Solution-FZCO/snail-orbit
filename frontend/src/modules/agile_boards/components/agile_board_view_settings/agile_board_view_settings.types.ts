import { KanbanCollisionDetection } from "shared/ui/kanban/kanban.types";

export type AgileBoardViewSettings = {
    showCustomFields?: boolean;
    showDescription?: boolean;
    collisionDetectionStrategy?: KanbanCollisionDetection;
};

export type TotalAgileBoardViewSettings = AgileBoardViewSettings & {
    minCardHeight?: string;
};

export const defaultAgileBoardViewSettings: AgileBoardViewSettings = {
    showDescription: false,
    showCustomFields: true,
    collisionDetectionStrategy: KanbanCollisionDetection.ShapeIntersection,
};
