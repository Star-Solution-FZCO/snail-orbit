import { Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import FieldPopper from "./components/field_popper.tsx";

const meta = {
    title: "Components/Field/Form",
    parameters: {
        layout: "centered",
    },
    decorators: [(Story) => <Story />],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyPopperForm: Story = {
    render: () => {
        const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

        return (
            <>
                <Button
                    variant="contained"
                    onClick={(e) =>
                        setAnchorEl((prev) => (!prev ? e.currentTarget : null))
                    }
                >
                    Open
                </Button>
                <FieldPopper
                    id="test"
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                >
                    Test
                </FieldPopper>
            </>
        );
    },
};
