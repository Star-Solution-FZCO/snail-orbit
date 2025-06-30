import type { CollisionDetector } from "@dnd-kit/abstract";
import type { ReactNode } from "react";
import type { UniqueIdentifier } from "../../kanban.types";

export type ItemProps = {
    id: UniqueIdentifier;
    itemIndex: number;
    columnIndex: number;
    swimLaneIndex: number;
    children: ReactNode;
    collisionDetector?: CollisionDetector;
};
