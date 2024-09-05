import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { Kanban as KanbanComp } from "./kanban";

const meta = {
    title: "Components/Kanban",
    parameters: {
        layout: "centered",
    },
    decorators: [(Story) => <Story />],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Kanban: Story = {
    render: () => {
        return (
            <Box sx={{ width: 1, height: 1 }}>
                <KanbanComp
                    lanes={[1, 2, 3].map((_, idx) => ({
                        title: "Lane " + idx,
                        items: [1, 2, 3, 4].map((_, itemIdx) => ({
                            title: "Item " + idx + " " + itemIdx,
                            id: "item-" + idx + "-" + itemIdx,
                        })),
                        id: "container-" + idx,
                    }))}
                />
            </Box>
        );
    },
};
