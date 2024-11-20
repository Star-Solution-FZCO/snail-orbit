import { Box, Paper } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { FieldChip } from "../../fields/field_chip/field_chip";
import IssueCard from "./issue_card";
import {
    IssueCardBody,
    IssueCardBottom,
    IssueCardHeader,
} from "./issue_card.styles";

const meta = {
    title: "Components/Issue/Card",
    component: IssueCard,
    parameters: {
        layout: "centered",
    },
    args: {},
    decorators: [
        (Story) => (
            <Box
                width={300}
                display="flex"
                flexDirection="column"
                component={Paper}
                borderRadius={1}
            >
                <Story />
            </Box>
        ),
    ],
} satisfies Meta<typeof IssueCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
    render: () => (
        <IssueCard
            sx={{
                minHeight: 120,
            }}
            colors={["red", "white", "blue"]}
        >
            <IssueCardBody>
                <IssueCardHeader>
                    <a href="/TEST-1">TEST-1</a>
                    <span>Hello world</span>
                </IssueCardHeader>
                <IssueCardBottom>
                    <FieldChip onClick={fn()} boxColor="pink">
                        Test
                    </FieldChip>
                    <FieldChip onClick={fn()} boxColor="red">
                        Test 2
                    </FieldChip>
                    <FieldChip onClick={fn()}>No box</FieldChip>
                    <FieldChip onClick={fn()} boxColor="blue"></FieldChip>
                </IssueCardBottom>
            </IssueCardBody>
        </IssueCard>
    ),
};
