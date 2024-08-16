import { CssBaseline, ThemeProvider } from "@mui/material";
import type { Preview } from "@storybook/react";
import { theme } from "../src/theme";

const preview: Preview = {
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
    },
    decorators: [
        // TODO: https://storybook.js.org/recipes/@mui/material
        (Story) => (
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Story />
            </ThemeProvider>
        ),
    ],
};

export default preview;
