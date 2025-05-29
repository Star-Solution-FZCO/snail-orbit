import type { DragDropEventHandlers } from "@dnd-kit/react";
import { DragDropProvider } from "@dnd-kit/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Container } from "./components/container";
import { Header } from "./components/header";
import { HeaderStyledContainer } from "./components/header/header.styles";
import Item from "./components/item";
import { SwimLine } from "./components/swim-line";
import { makeCopy, move, sensors } from "./kanban.helper";
import type { ItemData, KanbanItems, KanbanProps } from "./kanban.types";

export const Kanban = <I, S, C>({
    columns,
    swimLanes,
    getLabel,
    getKey,
    items: outerItems,
    ItemContent,
    inBlockColumns,
    onCardMoved,
    getIsClosed,
    onClosedChange,
}: KanbanProps<I, S, C>) => {
    const [items, setItems] = useState<KanbanItems<I>>(outerItems ?? []);
    const snapshot = useRef(makeCopy(items));
    const draggedItem = useRef<I | null>(null);
    const draggedItemData = useRef<ItemData | null>(null);

    useEffect(() => {
        setItems(outerItems ?? []);
    }, [outerItems]);

    const handleDragStart = useCallback<DragDropEventHandlers["onDragStart"]>(
        (event) => {
            snapshot.current = makeCopy(items);

            const target = event.operation.target;
            if (!target || !target.data) return;
            const data = target.data as ItemData;
            if (!data.itemIndex) return;
            draggedItem.current =
                items[data.swimLaneIndex][data.columnIndex][data.itemIndex];
            draggedItemData.current = data;
        },
        [items],
    );

    const handleDragOver = useCallback<DragDropEventHandlers["onDragOver"]>(
        (event) => {
            setItems((prev) => {
                return move(prev, event);
            });
        },
        [],
    );

    const handleDragEnd = useCallback<DragDropEventHandlers["onDragEnd"]>(
        (event) => {
            const { operation, canceled } = event;
            const { source, target } = operation;

            if (canceled || !source || !target) {
                setItems(snapshot.current);
                return;
            }
            if (
                !onCardMoved ||
                !draggedItem.current ||
                !draggedItemData.current
            )
                return;

            const sourceData = source.data as ItemData;

            const originalItemData = draggedItemData.current;
            const snapshotData = snapshot.current;

            onCardMoved(
                draggedItem.current,
                {
                    column: columns[originalItemData.columnIndex],
                    swimLane: swimLanes[originalItemData.swimLaneIndex],
                    after: originalItemData.itemIndex
                        ? snapshotData[originalItemData.swimLaneIndex][
                              originalItemData.columnIndex
                          ][originalItemData.itemIndex - 1]
                        : null,
                },
                {
                    column: columns[sourceData.columnIndex],
                    swimLane: swimLanes[sourceData.swimLaneIndex],
                    after: sourceData.itemIndex
                        ? items[sourceData.swimLaneIndex][
                              sourceData.columnIndex
                          ][sourceData.itemIndex - 1]
                        : null,
                },
            );
        },
        [columns, items, onCardMoved, swimLanes],
    );

    return (
        <DragDropProvider
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <HeaderStyledContainer>
                {columns.map((column) => (
                    <Header
                        key={getKey({ type: "column", value: column })}
                        label={getLabel({ type: "column", value: column })}
                        isClosed={getIsClosed?.({
                            type: "column",
                            value: column,
                        })}
                        onClosedChange={(value) =>
                            onClosedChange?.(
                                { type: "column", value: column },
                                value,
                            )
                        }
                    />
                ))}
            </HeaderStyledContainer>
            {swimLanes.map((swimLane, swimLaneIdx) => (
                <SwimLine
                    key={getKey({ type: "swimLane", value: swimLane })}
                    label={getLabel({ type: "swimLane", value: swimLane })}
                    isClosed={getIsClosed?.({
                        type: "swimLane",
                        value: swimLane,
                    })}
                    onClosedChange={(value) =>
                        onClosedChange?.(
                            { type: "swimLane", value: swimLane },
                            value,
                        )
                    }
                >
                    {columns.map((column, columnIdx) => (
                        <Container
                            key={getKey({ type: "column", value: column })}
                            columnIndex={columnIdx}
                            swimLaneIndex={swimLaneIdx}
                            columns={inBlockColumns}
                            isClosed={getIsClosed?.({
                                type: "column",
                                value: column,
                            })}
                        >
                            {items[swimLaneIdx] &&
                                items[swimLaneIdx][columnIdx] &&
                                items[swimLaneIdx][columnIdx].map(
                                    (item, index) => {
                                        return (
                                            <Item
                                                id={getKey({
                                                    type: "item",
                                                    value: item,
                                                })}
                                                key={getKey({
                                                    type: "item",
                                                    value: item,
                                                })}
                                                itemIndex={index}
                                                columnIndex={columnIdx}
                                                swimLaneIndex={swimLaneIdx}
                                            >
                                                {ItemContent ? (
                                                    <ItemContent data={item} />
                                                ) : (
                                                    getKey({
                                                        type: "item",
                                                        value: item,
                                                    })
                                                )}
                                            </Item>
                                        );
                                    },
                                )}
                        </Container>
                    ))}
                </SwimLine>
            ))}
        </DragDropProvider>
    );
};
