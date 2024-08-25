import { Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import FieldPopper from "./field_popper";

const meta = {
    title: "Components/Field/Popper",
    parameters: {
        layout: "centered",
    },
    decorators: [(Story) => <Story />],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyPopper: Story = {
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
