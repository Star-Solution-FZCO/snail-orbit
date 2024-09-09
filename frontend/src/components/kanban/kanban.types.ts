import {
    CancelDrop,
    KeyboardCoordinateGetter,
    Modifiers,
    UniqueIdentifier,
} from "@dnd-kit/core";
import { SortingStrategy } from "@dnd-kit/sortable";
import { CSSProperties } from "react";

export type Items = Record<UniqueIdentifier, UniqueIdentifier[]>;

export type KanbanProps = {
    adjustScale?: boolean;
    cancelDrop?: CancelDrop;
    columns?: number;
    containerStyle?: CSSProperties;
    coordinateGetter?: KeyboardCoordinateGetter;
    getItemStyles?(args: {
        value: UniqueIdentifier;
        index: number;
        overIndex: number;
        isDragging: boolean;
        containerId: UniqueIdentifier;
        isSorting: boolean;
        isDragOverlay: boolean;
    }): CSSProperties;
    handle?: boolean;
    items?: Items;
    modifiers?: Modifiers;
    renderItem?: any;
    scrollable?: boolean;
    strategy?: SortingStrategy;
    vertical?: boolean;
    wrapperStyle?(args: { index: number }): CSSProperties;
};
