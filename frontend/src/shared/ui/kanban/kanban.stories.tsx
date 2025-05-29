import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useState } from "react";
import { Kanban as KanbanComp } from "./kanban";
import type {
    ColumnArg,
    KanbanItems,
    KanbanProps,
    SwimLaneArg,
} from "./kanban.types";

const meta = {
    title: "Components/Kanban",
    parameters: {
        layout: "centered",
    },
    decorators: [(Story) => <Story />],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type DataType = { id: string; label: string };

const columns: DataType[] = new Array(4).fill(0).map((_, i) => ({
    id: `column-${i}`,
    label: `Column ${i}`,
}));

const swimLanes: DataType[] = new Array(4)
    .fill(0)
    .map((_, i) => ({ id: `swimlane-${i}`, label: `SwimLane ${i}` }));

const items: KanbanItems<DataType> = new Array(4).fill(0).map((_, i) =>
    new Array(4).fill(0).map((_, j) =>
        new Array(4).fill(0).map((_, k) => ({
            id: `item-${i}-${j}-${k}`,
            label: `Item ${i} ${j} ${k}`,
        })),
    ),
);

const getLabel: KanbanProps<DataType, DataType, DataType>["getLabel"] = (
    el,
) => {
    return el.value.label;
};

const getKey: KanbanProps<DataType, DataType, DataType>["getKey"] = (el) => {
    return el.value.id;
};

export const Kanban: Story = {
    render: () => {
        const [isClosedState, setIsClosedState] = useState<
            Record<string, boolean>
        >({});

        const handleGetIsOpen = useCallback(
            (arg: ColumnArg<DataType> | SwimLaneArg<DataType>) => {
                return isClosedState[arg.value.id] || false;
            },
            [isClosedState],
        );

        const handleOnOpenChane = useCallback(
            (
                data: ColumnArg<DataType> | SwimLaneArg<DataType>,
                value: boolean,
            ) => {
                setIsClosedState((prev) => ({
                    ...prev,
                    [data.value.id]: value,
                }));
            },
            [],
        );

        return (
            <Box sx={{ width: "100dvw", height: 1 }}>
                <KanbanComp<DataType, DataType, DataType>
                    columns={columns}
                    swimLanes={swimLanes}
                    items={items}
                    getLabel={getLabel}
                    getKey={getKey}
                    renderItemContent={() => "test"}
                    onCardMoved={console.log}
                    getIsClosed={handleGetIsOpen}
                    onClosedChange={handleOnOpenChane}
                />
            </Box>
        );
    },
};
