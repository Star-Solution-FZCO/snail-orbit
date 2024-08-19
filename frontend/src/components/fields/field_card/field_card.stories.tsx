import { Box } from "@mui/material";
import { action } from "@storybook/addon-actions";
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
            <Box
                width={300}
                border={1}
                borderColor="green"
                py={2}
                display="flex"
                flexDirection="column"
            >
                <Story />
            </Box>
        ),
    ],
} satisfies Meta<typeof FieldCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
    args: { label: "Hello", value: "World", orientation: "horizontal" },
};

export const Vertical: Story = {
    args: { label: "Hello", value: "World", orientation: "vertical" },
};

export const HorizontalLong: Story = {
    args: {
        label: "Hello world my old friend",
        value: "I have come to talk to you again",
        orientation: "horizontal",
    },
};

export const VerticalLong: Story = {
    args: {
        label: "Hello world my old friend",
        value: "I have come to talk to you again",
        orientation: "vertical",
    },
};

export const Multiple: Story = {
    render: () => (
        <>
            {[1, 2, 3, 4, 5].map((el) => (
                <FieldCard
                    key={el}
                    label={`Card ${el}`}
                    value={`Value ${el}`}
                    onClick={action(`Click ${el}`)}
                />
            ))}
        </>
    ),
    args: { label: "Hello", value: "World" },
};
