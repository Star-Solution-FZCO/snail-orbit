import { DraggableSyntheticListeners } from "@dnd-kit/core";
import { Transform } from "@dnd-kit/utilities";
import { CSSProperties, ReactNode } from "react";

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
    renderItemContent?(args: {
        dragOverlay: boolean;
        dragging: boolean;
        sorting: boolean;
        index: number | undefined;
        fadeIn: boolean;
        disabled: boolean;
        value: ItemProps["value"];
    }): ReactNode;
};
