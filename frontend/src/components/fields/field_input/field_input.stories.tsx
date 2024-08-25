import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { FieldInput } from "./field_input";

const meta = {
    title: "Components/Field/Input",
    parameters: {
        layout: "centered",
    },
    decorators: [(Story) => <Story />],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const StringInput: Story = {
    render: () => {
        const [value, setValue] = useState<string>("Hello world");

        return (
            <>
                <FieldInput
                    id="test"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
            </>
        );
    },
};
