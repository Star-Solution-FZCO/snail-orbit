import type { StyledComponent } from "@emotion/styled";
import type { TabPanelProps } from "@mui/lab";
import { TabPanel as MuiTabPanel } from "@mui/lab";
import { styled } from "@mui/material";

export const TabPanel: StyledComponent<TabPanelProps> = styled(
    MuiTabPanel,
)<TabPanelProps>({
    padding: 0,
    height: "100%",
});
