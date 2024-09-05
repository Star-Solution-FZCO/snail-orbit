import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box } from "@mui/material";
import { FC } from "react";
import { ItemType } from "./item.types";

const Item: FC<ItemType> = ({ id, title }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: id,
        data: {
            type: "item",
        },
    });
    return (
        <Box
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            style={{
                transition,
                transform: CSS.Translate.toString(transform),
            }}
            sx={{
                px: 2,
                py: 4,
                backgroundColor: "white",
                width: 1,
                border: "1px solid grey",
                cursor: "pointer",
                opacity: isDragging ? 50 : 100,
            }}
        >
            <div className="flex items-center justify-between">{title}</div>
        </Box>
    );
};

export default Item;
