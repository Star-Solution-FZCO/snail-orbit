import { UniqueIdentifier } from "@dnd-kit/core";
import { CSSProperties, ReactElement } from "react";

export type SortableItemProps = {
    containerId: UniqueIdentifier;
    id: UniqueIdentifier;
    index: number;
    disabled?: boolean;
    style(args: any): CSSProperties;
    getIndex(id: UniqueIdentifier): number;
    renderItem(): ReactElement;
    wrapperStyle({ index }: { index: number }): CSSProperties;
};
