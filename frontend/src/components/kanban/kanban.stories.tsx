import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { Kanban as KanbanComp } from "./kanban";
import { Items } from "./kanban.types";

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

const items: Items = {};
for (let i = 0; i < itemsCount; i++) {
    items[`${i}`] = {};
    for (let j = 0; j < itemsCount; j++) {
        items[`${i}`][`${i}-${j}`] = [];
        for (let k = 0; k < itemsCount; k++) {
            items[`${i}`][`${i}-${j}`].push(`${i}-${j}-${k}`);
        }
    }
}

export const Kanban: Story = {
    render: () => {
        return (
            <Box sx={{ width: "100dvw", height: 1 }}>
                <KanbanComp items={items} renderItemContent={() => "test"} />
            </Box>
        );
    },
};
