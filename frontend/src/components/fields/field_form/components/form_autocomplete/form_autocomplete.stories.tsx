import { Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { MouseEventHandler, useState } from "react";
import {
    FormAutocomplete,
    FormAutocompleteValueType,
} from "./form_autocomplete.tsx";

const meta = {
    title: "Components/Field/FormAutocomplete",
    parameters: {
        layout: "centered",
    },
    decorators: [(Story) => <Story />],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const MultiSelect: Story = {
    render: () => {
        const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
        const [value, setValue] = useState<FormAutocompleteValueType[]>([]);

        const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
            setAnchorEl(e.currentTarget);
        };

        const handleClose = () => {
            setAnchorEl(null);
        };

        return (
            <>
                <Button variant="contained" onClick={handleClick}>
                    Open
                </Button>
                <FormAutocomplete
                    id="test"
                    open={!!anchorEl}
                    anchorEl={anchorEl}
                    onClose={handleClose}
                    options={options}
                    multiple
                    value={value}
                    onChange={(_, value) => setValue(value)}
                    disableCloseOnSelect
                />
            </>
        );
    },
};

export const SingleSelect: Story = {
    render: () => {
        const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

        const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
            setAnchorEl(e.currentTarget);
        };

        const handleClose = () => {
            setAnchorEl(null);
        };

        return (
            <>
                <Button variant="contained" onClick={handleClick}>
                    Open
                </Button>
                <FormAutocomplete
                    id="test"
                    open={!!anchorEl}
                    anchorEl={anchorEl}
                    onClose={handleClose}
                    options={options}
                />
            </>
        );
    },
};

const options = [
    {
        label: "Project One",
        color: "#7057ff",
        description: "Very god",
        value: "some value",
    },
    {
        label: "Project two",
        color: "#1b0887",
        description: "Not very good",
        value: "some value",
    },
    {
        label: "Project three",
        color: "#b32b45",
        value: "some value",
    },
    {
        label: "Project four",
        color: "#27910f",
    },
    {
        label: "Project five",
        color: "#0b40a1",
    },
    {
        label: "Project sixth",
        color: "#451170",
        description: "HAHA",
    },
];
