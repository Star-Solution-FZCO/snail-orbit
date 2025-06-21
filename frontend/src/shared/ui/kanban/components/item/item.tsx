import { CollisionPriority } from "@dnd-kit/abstract";
import { useSortable } from "@dnd-kit/react/sortable";
import { memo, useMemo } from "react";
import { getGroupId } from "../../kanban.helper";
import { ItemStyled } from "./Item.styles";
import type { ItemProps } from "./item.types";

const ItemComponent = ({
    itemIndex,
    columnIndex,
    swimLaneIndex,
    id,
    children,
}: ItemProps) => {
    const groupId = useMemo(
        () => getGroupId({ columnIndex, swimLaneIndex }),
        [columnIndex, swimLaneIndex],
    );

    const { ref, isDragging } = useSortable({
        id: id,
        index: itemIndex,
        group: groupId,
        accept: ["item"],
        type: "item",
        feedback: "default",
        collisionPriority: CollisionPriority.Low,
        data: { itemIndex, columnIndex, swimLaneIndex },
    });

    return (
        <ItemStyled ref={ref} tabIndex={0} isDragging={isDragging}>
            {children}
        </ItemStyled>
    );
};

const Item = memo(ItemComponent);

Item.displayName = "Item";

export default Item;
