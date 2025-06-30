import { CollisionPriority } from "@dnd-kit/abstract";
import { useDroppable } from "@dnd-kit/react";
import type { CSSProperties, FC } from "react";
import { useMemo } from "react";
import { getGroupId } from "../../kanban.helper";
import { StyledContainer, StyledContainerList } from "./container.styles";
import type { ContainerProps } from "./container.types";

export const Container: FC<ContainerProps> = ({
    children,
    columns = 1,
    swimLaneIndex,
    columnIndex,
    isClosed,
    collisionDetector,
    ...props
}) => {
    const groupId = useMemo(
        () => getGroupId({ columnIndex, swimLaneIndex }),
        [columnIndex, swimLaneIndex],
    );

    const { ref, isDropTarget } = useDroppable({
        id: groupId,
        type: "container",
        accept: ["item"],
        collisionPriority: CollisionPriority.Lowest,
        collisionDetector: collisionDetector,
        data: {
            swimLaneIndex,
            columnIndex,
        },
    });

    return (
        <StyledContainer
            {...props}
            style={
                {
                    "--columns": columns,
                } as CSSProperties
            }
            ref={ref}
            hover={isDropTarget}
            sx={{ flexGrow: isClosed ? 0 : 1 }}
        >
            {isClosed === undefined || !isClosed ? (
                <StyledContainerList>{children}</StyledContainerList>
            ) : null}
        </StyledContainer>
    );
};
