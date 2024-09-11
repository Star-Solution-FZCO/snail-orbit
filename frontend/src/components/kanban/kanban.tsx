import {
    closestCenter,
    CollisionDetection,
    defaultDropAnimationSideEffects,
    DndContext,
    DragOverlay,
    DropAnimation,
    getFirstCollision,
    KeyboardSensor,
    MeasuringStrategy,
    MouseSensor,
    pointerWithin,
    rectIntersection,
    TouchSensor,
    UniqueIdentifier,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    horizontalListSortingStrategy,
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Container } from "./components/container";
import { DroppableContainer } from "./components/droppable-container";
import { DroppableSwimLine } from "./components/droppable-swim-line/DroppableSwimLine";
import Item from "./components/item";
import { SortableItem } from "./components/sortable-item";
import { SwimLine } from "./components/swim-line";
import { Items, KanbanProps } from "./kanban.types";
import { multipleContainersKeyboardCoordinates } from "./utils/multipleContainersKeyboardCoordinates";

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: "0.5",
            },
        },
    }),
};

// I hate this :c
export const Kanban: FC<KanbanProps> = ({
    adjustScale = false,
    cancelDrop,
    columns,
    items: initialItems,
    containerStyle,
    coordinateGetter = multipleContainersKeyboardCoordinates,
    getItemStyles = () => ({}),
    wrapperStyle = () => ({}),
    modifiers,
    renderItem,
    vertical = false,
    scrollable,
}) => {
    const [items, setItems] = useState<Items>(() => initialItems ?? {});
    const [swimLines, setSwimLines] = useState(
        Object.keys(items) as UniqueIdentifier[],
    );
    const [containers, setContainers] = useState(
        swimLines.reduce(
            (prev, id) => {
                prev[id] = Object.keys(items[id]);
                return prev;
            },
            {} as Record<UniqueIdentifier, UniqueIdentifier[]>,
        ),
    );
    const containerToSwimLineMap = useMemo(() => {
        const res: Record<UniqueIdentifier, UniqueIdentifier> = {};
        for (const swimLine of Object.keys(items))
            for (const container of Object.keys(items[swimLine]))
                res[container] = swimLine;
        return res;
    }, [items]);
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [clonedItems, setClonedItems] = useState<Items | null>(null);
    const lastOverId = useRef<UniqueIdentifier | null>(null);
    const recentlyMovedToNewContainer = useRef(false);
    const isSortingContainer = activeId
        ? !!containerToSwimLineMap[activeId]
        : false;
    const isSortingSwimLines = activeId ? swimLines.includes(activeId) : false;

    const collisionDetectionStrategy: CollisionDetection = useCallback(
        (args) => {
            if (activeId && activeId in items) {
                return closestCenter({
                    ...args,
                    droppableContainers: args.droppableContainers.filter(
                        (container) => container.id in items,
                    ),
                });
            }

            // Start by finding any intersecting droppable
            const pointerIntersections = pointerWithin(args);
            const intersections =
                pointerIntersections.length > 0
                    ? // If there are droppables intersecting with the pointer, return those
                      pointerIntersections
                    : rectIntersection(args);
            let overId = getFirstCollision(intersections, "id");

            if (overId != null && activeId != null) {
                const overContainer = findContainer(overId);
                const overSwimLine = findSwimLine(overId);
                const activeContainer = findContainer(activeId);

                if (
                    overId === overContainer &&
                    overSwimLine &&
                    activeId !== activeContainer
                ) {
                    const containerItems = items[overSwimLine][overContainer];

                    // If a container is matched and it contains items
                    if (containerItems.length > 0) {
                        // Return the closest droppable within that container
                        overId = closestCenter({
                            ...args,
                            droppableContainers:
                                args.droppableContainers.filter(
                                    (container) =>
                                        container.id !== overId &&
                                        containerItems.includes(container.id),
                                ),
                        })[0]?.id;
                    }
                }

                lastOverId.current = overId;

                return [{ id: overId }];
            }

            // When a draggable item moves to a new container, the layout may shift
            // and the `overId` may become `null`. We manually set the cached `lastOverId`
            // to the id of the draggable item that was moved to the new container, otherwise
            // the previous `overId` will be returned which can cause items to incorrectly shift positions
            if (recentlyMovedToNewContainer.current) {
                lastOverId.current = activeId;
            }

            // If no droppable is matched, return the last match
            return lastOverId.current ? [{ id: lastOverId.current }] : [];
        },
        [activeId, items],
    );

    const sensors = useSensors(
        useSensor(MouseSensor),
        useSensor(TouchSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter,
        }),
    );

    const findSwimLine = (id: UniqueIdentifier) => {
        // TODO: Make it FASTER (prefer O(1))
        if (id in items) return id;
        return Object.keys(items).find(
            (swimLineId) =>
                id in items[swimLineId] ||
                Object.keys(items[swimLineId]).some((containerId) =>
                    items[swimLineId][containerId].includes(id),
                ),
        );
    };

    const findContainer = (id: UniqueIdentifier) => {
        // TODO: Make it FASTER (prefer O(1))
        const swimLineIds = Object.keys(items);
        for (const swimLineId of swimLineIds) {
            const containers = items[swimLineId];
            if (id in containers) return id;
            const containerIds = Object.keys(containers);
            for (const containerId of containerIds) {
                if (containers[containerId].includes(id)) return containerId;
            }
        }

        return undefined;
    };

    const getIndex = (id: UniqueIdentifier) => {
        const swimLine = findSwimLine(id);
        const container = findContainer(id);

        if (!container || !swimLine) {
            return -1;
        }

        return items[swimLine][container].indexOf(id);
    };

    const onDragCancel = () => {
        if (clonedItems) {
            // Reset items to their original state in case items have been
            // Dragged across containers
            setItems(clonedItems);
        }

        setActiveId(null);
        setClonedItems(null);
    };

    useEffect(() => {
        requestAnimationFrame(() => {
            recentlyMovedToNewContainer.current = false;
        });
    }, [items]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={collisionDetectionStrategy}
            measuring={{
                droppable: {
                    strategy: MeasuringStrategy.Always,
                },
            }}
            onDragStart={({ active }) => {
                setActiveId(active.id);
                setClonedItems(items);
            }}
            onDragOver={({ active, over }) => {
                const overId = over?.id;

                if (overId == null) {
                    return;
                }

                const overSwimLine = findSwimLine(overId);
                const activeSwimLine = findSwimLine(active.id);
                const overContainer = findContainer(overId);
                const activeContainer = findContainer(active.id);
                const activeType = active.data.current?.type;
                const overType = over?.data.current?.type;

                if (!overSwimLine || !activeSwimLine) {
                    return;
                }

                if (
                    activeType === "item" &&
                    activeContainer &&
                    overContainer &&
                    activeContainer !== overContainer
                ) {
                    setItems((items) => {
                        const activeItems =
                            items[activeSwimLine][activeContainer];
                        const overItems = items[overSwimLine][overContainer];
                        const overIndex = overItems.indexOf(overId);
                        const activeIndex = activeItems.indexOf(active.id);

                        let newIndex: number;

                        if (overId in items) {
                            newIndex = overItems.length + 1;
                        } else {
                            const isBelowOverItem =
                                over &&
                                active.rect.current.translated &&
                                active.rect.current.translated.top >
                                    over.rect.top + over.rect.height;

                            const modifier = isBelowOverItem ? 1 : 0;

                            newIndex =
                                overIndex >= 0
                                    ? overIndex + modifier
                                    : overItems.length + 1;
                        }

                        recentlyMovedToNewContainer.current = true;

                        // Delete the old one, insert new one
                        const copy = structuredClone(items);
                        const itemToMove =
                            copy[activeSwimLine][activeContainer][activeIndex];
                        copy[activeSwimLine][activeContainer] = copy[
                            activeSwimLine
                        ][activeContainer].filter((item) => item !== active.id);
                        copy[overSwimLine][overContainer] = [
                            ...items[overSwimLine][overContainer].slice(
                                0,
                                newIndex,
                            ),
                            itemToMove,
                            ...items[overSwimLine][overContainer].slice(
                                newIndex,
                                items[overSwimLine][overContainer].length,
                            ),
                        ];

                        return copy;
                    });
                }
            }}
            onDragEnd={({ active, over }) => {
                if (!over?.id) {
                    setActiveId(null);
                    return;
                }

                const overSwimLine = findSwimLine(over.id);
                const activeSwimLine = findSwimLine(active.id);
                const overContainer = findContainer(over.id);
                const activeContainer = findContainer(active.id);

                if (!overSwimLine || !activeSwimLine) {
                    setActiveId(null);
                    return;
                }

                // If both are equal then item card was moved
                if (
                    overContainer === activeContainer &&
                    overSwimLine === activeSwimLine &&
                    activeContainer &&
                    overContainer
                ) {
                    const activeIndex = items[activeSwimLine][
                        activeContainer
                    ].indexOf(active.id);
                    const overIndex = items[overSwimLine][
                        overContainer
                    ].indexOf(over.id);

                    setItems((items) => {
                        const copy = structuredClone(items);
                        copy[overSwimLine][overContainer] = arrayMove(
                            copy[overSwimLine][overContainer],
                            activeIndex,
                            overIndex,
                        );
                        return copy;
                    });
                } // If only swim lines are equal than container was moved
                else if (overSwimLine === activeSwimLine) {
                    const activeIndex = containers[activeSwimLine].indexOf(
                        active.id,
                    );
                    const overIndex = containers[overSwimLine].indexOf(over.id);

                    setContainers((containers) => {
                        const copy = structuredClone(containers);
                        copy[overSwimLine] = arrayMove(
                            copy[overSwimLine],
                            activeIndex,
                            overIndex,
                        );
                        return copy;
                    });
                } // If every thing is different than swimline was moved
                else {
                    const activeIndex = swimLines.indexOf(active.id);
                    const overIndex = swimLines.indexOf(over.id);

                    setSwimLines((swimLines) =>
                        arrayMove(swimLines, activeIndex, overIndex),
                    );
                }

                setActiveId(null);
            }}
            cancelDrop={cancelDrop}
            onDragCancel={onDragCancel}
            modifiers={modifiers}
        >
            <SortableContext
                items={swimLines}
                strategy={
                    !vertical
                        ? verticalListSortingStrategy
                        : horizontalListSortingStrategy
                }
            >
                {swimLines.map((swimLineId) => (
                    <DroppableSwimLine
                        key={swimLineId}
                        sx={{ backgroundColor: "red" }}
                        id={swimLineId}
                        items={swimLines}
                    >
                        <SortableContext
                            items={containers[swimLineId]}
                            strategy={
                                vertical
                                    ? verticalListSortingStrategy
                                    : horizontalListSortingStrategy
                            }
                        >
                            {containers[swimLineId].map((containerId) => (
                                <DroppableContainer
                                    key={containerId}
                                    id={containerId}
                                    label={`Column ${containerId}`}
                                    columns={columns}
                                    items={containers[swimLineId]}
                                    scrollable={scrollable}
                                    style={containerStyle}
                                >
                                    <SortableContext
                                        items={items[swimLineId][containerId]}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {items[swimLineId][containerId].map(
                                            (value, index) => {
                                                return (
                                                    <SortableItem
                                                        disabled={
                                                            isSortingContainer
                                                        }
                                                        key={value}
                                                        id={value}
                                                        index={index}
                                                        style={getItemStyles}
                                                        wrapperStyle={
                                                            wrapperStyle
                                                        }
                                                        renderItem={renderItem}
                                                        containerId={
                                                            containerId
                                                        }
                                                        getIndex={getIndex}
                                                    />
                                                );
                                            },
                                        )}
                                    </SortableContext>
                                </DroppableContainer>
                            ))}
                        </SortableContext>
                    </DroppableSwimLine>
                ))}
            </SortableContext>
            {createPortal(
                <DragOverlay
                    adjustScale={adjustScale}
                    dropAnimation={dropAnimation}
                >
                    {activeId
                        ? activeId in items
                            ? renderSwimLineDragOverlay(activeId)
                            : containerToSwimLineMap[activeId]
                              ? renderContainerDragOverlay(
                                    containerToSwimLineMap[activeId],
                                    activeId,
                                )
                              : renderSortableItemDragOverlay(activeId)
                        : null}
                </DragOverlay>,
                document.body,
            )}
        </DndContext>
    );

    function renderSortableItemDragOverlay(id: UniqueIdentifier) {
        return (
            <Item
                value={id}
                style={getItemStyles({
                    containerId: findContainer(id) as UniqueIdentifier,
                    overIndex: -1,
                    index: getIndex(id),
                    value: id,
                    isSorting: true,
                    isDragging: true,
                    isDragOverlay: true,
                })}
                wrapperStyle={wrapperStyle({ index: 0 })}
                renderItem={renderItem}
                dragOverlay
            />
        );
    }

    function renderContainerDragOverlay(
        swimLineId: UniqueIdentifier,
        containerId: UniqueIdentifier,
    ) {
        return (
            <Container
                label={`Column ${containerId}`}
                columns={columns}
                style={{
                    height: "100%",
                }}
                shadow
            >
                {items[swimLineId][containerId].map((item, index) => (
                    <Item
                        key={item}
                        value={item}
                        style={getItemStyles({
                            containerId,
                            overIndex: -1,
                            index: getIndex(item),
                            value: item,
                            isDragging: false,
                            isSorting: false,
                            isDragOverlay: false,
                        })}
                        wrapperStyle={wrapperStyle({ index })}
                        renderItem={renderItem}
                    />
                ))}
            </Container>
        );
    }

    function renderSwimLineDragOverlay(swimLineId: UniqueIdentifier) {
        return (
            <SwimLine style={{ height: "100%" }} shadow>
                {containers[swimLineId].map((containerId) =>
                    renderContainerDragOverlay(swimLineId, containerId),
                )}
            </SwimLine>
        );
    }
};
