import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { Kanban as KanbanComp } from "./kanban";

const defaultInitializer = (index: number) => index;

function createRange<T = number>(
    length: number,
    initializer: (index: number) => any = defaultInitializer,
): T[] {
    return [...new Array(length)].map((_, index) => initializer(index));
}

const meta = {
    title: "Components/Kanban",
    parameters: {
        layout: "centered",
    },
    decorators: [(Story) => <Story />],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const itemsCount = 4;

const items = {
    Hello: createRange(itemsCount, (idx) => `Hello ${idx}`),
    World: createRange(itemsCount, (idx) => `World ${idx}`),
    My: createRange(itemsCount, (idx) => `My ${idx}`),
    Friend: createRange(itemsCount, (idx) => `Friend ${idx}`),
};

export const Kanban: Story = {
    render: () => {
        return (
            <Box sx={{ width: 1, height: 1 }}>
                <KanbanComp items={items} />
            </Box>
        );
    },
};
