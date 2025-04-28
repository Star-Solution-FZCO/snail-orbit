import { Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { MouseEventHandler, useState } from "react";
import FormInputPopover, { FormInputPopoverProps } from "./form_input";

const meta = {
    title: "Components/Field/Form/Input Popover",
    parameters: {
        layout: "centered",
    },
    decorators: [(Story) => <Story />],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type CompProps = {
    value: string;
} & Omit<FormInputPopoverProps, "value" | "id" | "open" | "anchorEl" | "ref">;

const Comp = ({ value: initialValue, ...rest }: CompProps) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [value, setValue] = useState<string>(initialValue || "");

    const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
        setAnchorEl(e.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSubmit = (value: string) => {
        setValue(value);
        setAnchorEl(null);
    };

    return (
        <>
            <div>{value}</div>
            <Button variant="contained" onClick={handleClick}>
                Open
            </Button>
            <FormInputPopover
                id="test"
                open={!!anchorEl}
                anchorEl={anchorEl}
                onClose={handleClose}
                value={value}
                onChange={handleSubmit}
                {...rest}
            />
        </>
    );
};

export const StringInput: Story = {
    render: () => <Comp value="Hello world" />,
};

export const IntegerInput: Story = {
    render: () => <Comp value="123" inputMode="numeric" />,
};

export const DecimalInput: Story = {
    render: () => <Comp value="123.123" inputMode="decimal" />,
};
