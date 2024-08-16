import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import FieldCard from "components/fields/field_card/field_card.tsx";

const meta = {
    title: "Components/FieldCard",
    component: FieldCard,
    parameters: {
        layout: "centered",
    },
    args: { onClick: fn() },
    decorators: [
        (Story) => (
            <Box width={300} border={1} borderColor="green" py={2}>
                <Story />
            </Box>
        ),
    ],
} satisfies Meta<typeof FieldCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
    args: { label: "Hello", value: "World" },
};
