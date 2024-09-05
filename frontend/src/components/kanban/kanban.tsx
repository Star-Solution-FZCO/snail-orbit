import { FC, useState } from "react";

import {
    closestCorners,
    DndContext,
    DragEndEvent,
    DragMoveEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    UniqueIdentifier,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Stack } from "@mui/material";
import { default as Item, default as Items } from "./components/item/item";
import { LaneMetadata } from "./components/kanban.types";
import Lane from "./components/lane/lane";
import { KanbanProps } from "./kanban.types";

export const Kanban: FC<KanbanProps> = ({ lanes }) => {
    const [containers, setContainers] = useState<LaneMetadata[]>(lanes);
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

    function findValueOfItems(id: UniqueIdentifier | undefined, type: string) {
        if (type === "container") {
            return containers.find((item) => item.id === id);
        }
        if (type === "item") {
            return containers.find((container) =>
                container.items.find((item) => item.id === id),
            );
        }
    }

    const findItemTitle = (id: UniqueIdentifier | undefined) => {
        const container = findValueOfItems(id, "item");
        if (!container) return "";
        const item = container.items.find((item) => item.id === id);
        if (!item) return "";
        return item.title;
    };

    const findContainerTitle = (id: UniqueIdentifier | undefined) => {
        const container = findValueOfItems(id, "container");
        if (!container) return "";
        return container.title;
    };

    const findContainerItems = (id: UniqueIdentifier | undefined) => {
        const container = findValueOfItems(id, "container");
        if (!container) return [];
        return container.items;
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    function handleDragStart(event: DragStartEvent) {
        const { active } = event;
        const { id } = active;
        setActiveId(id);
    }

    const handleDragMove = (event: DragMoveEvent) => {
        const { active, over } = event;

        if (
            active.id.toString().includes("item") &&
            over?.id.toString().includes("item") &&
            active &&
            over &&
            active.id !== over.id
        ) {
            const activeContainer = findValueOfItems(active.id, "item");
            const overContainer = findValueOfItems(over.id, "item");

            if (!activeContainer || !overContainer) return;

            const activeContainerIndex = containers.findIndex(
                (container) => container.id === activeContainer.id,
            );
            const overContainerIndex = containers.findIndex(
                (container) => container.id === overContainer.id,
            );

            const activeitemIndex = activeContainer.items.findIndex(
                (item) => item.id === active.id,
            );
            const overitemIndex = overContainer.items.findIndex(
                (item) => item.id === over.id,
            );

            if (activeContainerIndex === overContainerIndex) {
                let newItems = [...containers];
                newItems[activeContainerIndex].items = arrayMove(
                    newItems[activeContainerIndex].items,
                    activeitemIndex,
                    overitemIndex,
                );

                setContainers(newItems);
            } else {
                let newItems = [...containers];
                const [removeditem] = newItems[
                    activeContainerIndex
                ].items.splice(activeitemIndex, 1);
                newItems[overContainerIndex].items.splice(
                    overitemIndex,
                    0,
                    removeditem,
                );
                setContainers(newItems);
            }
        }

        if (
            active.id.toString().includes("item") &&
            over?.id.toString().includes("container") &&
            active &&
            over &&
            active.id !== over.id
        ) {
            const activeContainer = findValueOfItems(active.id, "item");
            const overContainer = findValueOfItems(over.id, "container");

            if (!activeContainer || !overContainer) return;

            const activeContainerIndex = containers.findIndex(
                (container) => container.id === activeContainer.id,
            );
            const overContainerIndex = containers.findIndex(
                (container) => container.id === overContainer.id,
            );

            const activeitemIndex = activeContainer.items.findIndex(
                (item) => item.id === active.id,
            );

            let newItems = [...containers];
            const [removeditem] = newItems[activeContainerIndex].items.splice(
                activeitemIndex,
                1,
            );
            newItems[overContainerIndex].items.push(removeditem);
            setContainers(newItems);
        }
    };

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (
            active.id.toString().includes("container") &&
            over?.id.toString().includes("container") &&
            active &&
            over &&
            active.id !== over.id
        ) {
            const activeContainerIndex = containers.findIndex(
                (container) => container.id === active.id,
            );
            const overContainerIndex = containers.findIndex(
                (container) => container.id === over.id,
            );
            let newItems = [...containers];
            newItems = arrayMove(
                newItems,
                activeContainerIndex,
                overContainerIndex,
            );
            setContainers(newItems);
        }

        if (
            active.id.toString().includes("item") &&
            over?.id.toString().includes("item") &&
            active &&
            over &&
            active.id !== over.id
        ) {
            const activeContainer = findValueOfItems(active.id, "item");
            const overContainer = findValueOfItems(over.id, "item");

            if (!activeContainer || !overContainer) return;

            const activeContainerIndex = containers.findIndex(
                (container) => container.id === activeContainer.id,
            );
            const overContainerIndex = containers.findIndex(
                (container) => container.id === overContainer.id,
            );

            const activeitemIndex = activeContainer.items.findIndex(
                (item) => item.id === active.id,
            );
            const overitemIndex = overContainer.items.findIndex(
                (item) => item.id === over.id,
            );

            if (activeContainerIndex === overContainerIndex) {
                let newItems = [...containers];
                newItems[activeContainerIndex].items = arrayMove(
                    newItems[activeContainerIndex].items,
                    activeitemIndex,
                    overitemIndex,
                );
                setContainers(newItems);
            } else {
                let newItems = [...containers];
                const [removeditem] = newItems[
                    activeContainerIndex
                ].items.splice(activeitemIndex, 1);
                newItems[overContainerIndex].items.splice(
                    overitemIndex,
                    0,
                    removeditem,
                );
                setContainers(newItems);
            }
        }

        if (
            active.id.toString().includes("item") &&
            over?.id.toString().includes("container") &&
            active &&
            over &&
            active.id !== over.id
        ) {
            const activeContainer = findValueOfItems(active.id, "item");
            const overContainer = findValueOfItems(over.id, "container");

            if (!activeContainer || !overContainer) return;

            const activeContainerIndex = containers.findIndex(
                (container) => container.id === activeContainer.id,
            );
            const overContainerIndex = containers.findIndex(
                (container) => container.id === overContainer.id,
            );

            const activeitemIndex = activeContainer.items.findIndex(
                (item) => item.id === active.id,
            );

            let newItems = [...containers];
            const [removeditem] = newItems[activeContainerIndex].items.splice(
                activeitemIndex,
                1,
            );
            newItems[overContainerIndex].items.push(removeditem);
            setContainers(newItems);
        }
        setActiveId(null);
    }

    console.log(containers);

    return (
        <Stack flexDirection="row" gap={4}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={containers.map((i) => i.id)}>
                    {containers.map((container) => (
                        <Lane
                            id={container.id}
                            title={container.title}
                            key={container.id}
                        >
                            <SortableContext
                                items={container.items.map((i) => i.id)}
                            >
                                <Stack>
                                    {container.items.map((i) => (
                                        <Items
                                            title={i.title}
                                            id={i.id}
                                            key={i.id}
                                        />
                                    ))}
                                </Stack>
                            </SortableContext>
                        </Lane>
                    ))}
                </SortableContext>
                <DragOverlay adjustScale={false}>
                    {activeId && activeId.toString().includes("item") && (
                        <Item id={activeId} title={findItemTitle(activeId)} />
                    )}
                    {activeId && activeId.toString().includes("container") && (
                        <Lane
                            id={activeId}
                            title={findContainerTitle(activeId)}
                        >
                            {findContainerItems(activeId).map((i) => (
                                <Items key={i.id} title={i.title} id={i.id} />
                            ))}
                        </Lane>
                    )}
                </DragOverlay>
            </DndContext>
        </Stack>
    );
};
