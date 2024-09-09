import { DraggableSyntheticListeners } from "@dnd-kit/core";
import { Transform } from "@dnd-kit/utilities";
import { CSSProperties, ReactElement, ReactNode, Ref } from "react";

export type ItemProps = {
    dragOverlay?: boolean;
    color?: string;
    disabled?: boolean;
    dragging?: boolean;
    height?: number;
    index?: number;
    fadeIn?: boolean;
    transform?: Transform | null;
    listeners?: DraggableSyntheticListeners;
    sorting?: boolean;
    style?: CSSProperties;
    transition?: string | null;
    wrapperStyle?: CSSProperties;
    value: ReactNode;
    renderItem?(args: {
        dragOverlay: boolean;
        dragging: boolean;
        sorting: boolean;
        index: number | undefined;
        fadeIn: boolean;
        listeners: DraggableSyntheticListeners;
        ref: Ref<HTMLElement>;
        style: CSSProperties | undefined;
        transform: ItemProps["transform"];
        transition: ItemProps["transition"];
        value: ItemProps["value"];
    }): ReactElement;
};
