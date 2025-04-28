import { Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import dayjs, { Dayjs } from "dayjs";
import { MouseEventHandler, useState } from "react";
import FormDatePopover, { FormDatePopoverProps } from "./form_date";

const meta = {
    title: "Components/Field/Form/Date Popover",
    parameters: {
        layout: "centered",
    },
    decorators: [(Story) => <Story />],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type CompProps = {
    type: FormDatePopoverProps["type"];
};

const Comp = ({ type }: CompProps) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [value, setValue] = useState<Dayjs>(dayjs());

    const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
        setAnchorEl(e.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSubmit = (value: Dayjs) => {
        setValue(value);
        setAnchorEl(null);
    };

    return (
        <>
            <div>{value.toString()}</div>
            <Button variant="contained" onClick={handleClick}>
                Open
            </Button>
            <FormDatePopover
                id="test"
                open={!!anchorEl}
                anchorEl={anchorEl}
                onClose={handleClose}
                value={value}
                onChange={handleSubmit}
                type={type}
            />
        </>
    );
};

export const Date: Story = {
    render: () => <Comp type="date" />,
};

export const DateTime: Story = {
    render: () => <Comp type="datetime" />,
};
