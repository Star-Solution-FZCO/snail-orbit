import {
    AnimateLayoutChanges,
    defaultAnimateLayoutChanges,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FC } from "react";
import { Container } from "../container";
import { DroppableContainerProps } from "./DroppableContainer.types";

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
    defaultAnimateLayoutChanges({ ...args, wasDragging: true });

export const DroppableContainer: FC<DroppableContainerProps> = ({
    id,
    children,
    columns = 1,
    disabled,
    items,
    style,
    ...props
}) => {
    const {
        active,
        attributes,
        isDragging,
        listeners,
        over,
        setNodeRef,
        transition,
        transform,
    } = useSortable({
        id,
        data: {
            type: "container",
            children: items,
        },
        animateLayoutChanges,
    });
    const isOverContainer = over
        ? (id === over.id && active?.data.current?.type !== "container") ||
          items.includes(over.id)
        : false;

    return (
        <Container
            ref={disabled ? undefined : setNodeRef}
            style={{
                ...style,
                transition,
                transform: CSS.Translate.toString(transform),
                opacity: isDragging ? 0.5 : undefined,
            }}
            hover={isOverContainer}
            handleProps={{
                ...attributes,
                ...listeners,
            }}
            columns={columns}
            {...props}
        >
            {children}
        </Container>
    );
};
