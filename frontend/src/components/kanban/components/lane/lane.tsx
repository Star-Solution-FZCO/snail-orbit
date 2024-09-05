import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, Button, Stack } from "@mui/material";
import { LaneProps } from "./lane.types";

export const Lane = ({ id, children, title }: LaneProps) => {
    const {
        attributes,
        setNodeRef,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: id,
        data: {
            type: "container",
        },
    });

    return (
        <Box
            {...attributes}
            ref={setNodeRef}
            style={{
                transition,
                transform: CSS.Translate.toString(transform),
            }}
            sx={{
                width: 1,
                height: 1,
                padding: 4,
                backgroundColor: "gray[500]",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                opacity: isDragging ? 50 : 100,
            }}
        >
            <Stack alignItems="center">
                <Stack alignItems="center">
                    <h1>{title}</h1>
                </Stack>
                <Button {...listeners}>Drag Handle</Button>
            </Stack>
            {children}
        </Box>
    );
};

export default Lane;
