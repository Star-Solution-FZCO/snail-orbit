import {
    AnimateLayoutChanges,
    defaultAnimateLayoutChanges,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FC } from "react";
import { SwimLine } from "../swim-line";
import { DroppableSwimLineProps } from "./DroppableSwimLine.types";

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
    defaultAnimateLayoutChanges({ ...args, wasDragging: true });

export const DroppableSwimLine: FC<DroppableSwimLineProps> = ({
    id,
    children,
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
            type: "swimLine",
            children: items,
        },
        animateLayoutChanges,
    });
    const isOverContainer = over
        ? (id === over.id && active?.data.current?.type !== "swimLine") ||
          items.includes(over.id)
        : false;

    return (
        <SwimLine
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
            {...props}
        >
            {children}
        </SwimLine>
    );
};
