import {
    CancelDrop,
    KeyboardCoordinateGetter,
    Modifiers,
    UniqueIdentifier,
} from "@dnd-kit/core";
import { CSSProperties } from "react";
import { ContainerProps } from "./components/container";
import { ItemProps } from "./components/item";
import { SwimLineProps } from "./components/swim-line";

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
    onCardMoved?(
        id: UniqueIdentifier,
        from: {
            column: UniqueIdentifier;
            swimLine: UniqueIdentifier;
            after: UniqueIdentifier | null;
        },
        to: {
            column: UniqueIdentifier;
            swimLine: UniqueIdentifier;
            after: UniqueIdentifier | null;
        },
    ): Promise<boolean | undefined> | boolean | undefined | void;
    swimLineProps?:
        | Omit<SwimLineProps, "children">
        | ((swimLineId: UniqueIdentifier) => Omit<SwimLineProps, "children">);
    containerProps?:
        | Omit<ContainerProps, "children">
        | ((containerId: UniqueIdentifier) => Omit<ContainerProps, "children">);
};
