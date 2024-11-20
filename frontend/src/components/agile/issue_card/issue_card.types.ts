import { Box } from "@mui/material";
import { ComponentProps } from "react";

export type IssueCardProps = {
    colors?: string[];
} & ComponentProps<typeof Box>;
