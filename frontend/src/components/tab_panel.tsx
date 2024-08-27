import { TabPanel as MuiTabPanel, TabPanelProps } from "@mui/lab";
import { styled } from "@mui/material";

export const TabPanel = styled(MuiTabPanel)<TabPanelProps>({
    padding: 0,
    height: "100%",
});
