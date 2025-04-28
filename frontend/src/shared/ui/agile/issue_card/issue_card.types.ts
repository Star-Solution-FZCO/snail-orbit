import type { Box } from "@mui/material";
import type { ComponentProps } from "react";

export type IssueCardProps = {
    colors?: string[];
} & ComponentProps<typeof Box>;
