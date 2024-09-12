import {
    CancelDrop,
    KeyboardCoordinateGetter,
    Modifiers,
    UniqueIdentifier,
} from "@dnd-kit/core";
import { CSSProperties } from "react";
import { ItemProps } from "./components/item";

export type Items = Record<
    UniqueIdentifier,
    Record<UniqueIdentifier, UniqueIdentifier[]>
>;

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
    renderItemContent?: ItemProps["renderItemContent"];
    scrollable?: boolean;
    vertical?: boolean;
    wrapperStyle?(args: { index: number }): CSSProperties;
};
