import { UniqueIdentifier } from "@dnd-kit/core";
import { CSSProperties } from "react";
import { ItemProps } from "../item";

export type SortableItemProps = {
    containerId: UniqueIdentifier;
    id: UniqueIdentifier;
    index: number;
    disabled?: boolean;
    style(args: any): CSSProperties;
    getIndex(id: UniqueIdentifier): number;
    renderItemContent?: ItemProps["renderItemContent"];
    wrapperStyle({ index }: { index: number }): CSSProperties;
};
