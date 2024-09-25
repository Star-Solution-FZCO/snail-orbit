import { useSortable } from "@dnd-kit/sortable";
import { FC } from "react";
import { useMountStatus } from "../../utils/useMountStatus";
import Item from "../item";
import { SortableItemProps } from "./SortableItem.types";

export const SortableItem: FC<SortableItemProps> = ({
    disabled,
    id,
    index,
    renderItemContent,
    style,
    containerId,
    getIndex,
    wrapperStyle,
}) => {
    const {
        setNodeRef,
        listeners,
        isDragging,
        isSorting,
        over,
        overIndex,
        transform,
        transition,
    } = useSortable({
        id,
        data: {
            type: "item",
        },
    });
    const mounted = useMountStatus();
    const mountedWhileDragging = isDragging && !mounted;

    return (
        <Item
            ref={disabled ? undefined : setNodeRef}
            id={id}
            dragging={isDragging}
            sorting={isSorting}
            index={index}
            wrapperStyle={wrapperStyle({ index })}
            style={style({
                index,
                value: id,
                isDragging,
                isSorting,
                overIndex: over ? getIndex(over.id) : overIndex,
                containerId,
            })}
            transition={transition}
            transform={transform}
            fadeIn={mountedWhileDragging}
            listeners={listeners}
            renderItemContent={renderItemContent}
        />
    );
};
