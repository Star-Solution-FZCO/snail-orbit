import {
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
    Stack,
    useColorScheme,
} from "@mui/material";

export const Workspace = () => {
    const { mode, setMode } = useColorScheme();

    return (
        <Stack spacing={2} height={1}>
            <FormControl>
                <FormLabel id="theme-toggle">Theme</FormLabel>
                <RadioGroup
                    aria-labelledby="theme-toggle"
                    name="theme-toggle"
                    row
                    value={mode}
                    onChange={(event) =>
                        setMode(
                            event.target.value as "system" | "light" | "dark",
                        )
                    }
                >
                    <FormControlLabel
                        value="system"
                        control={<Radio />}
                        label="System"
                    />
                    <FormControlLabel
                        value="light"
                        control={<Radio />}
                        label="Light"
                    />
                    <FormControlLabel
                        value="dark"
                        control={<Radio />}
                        label="Dark"
                    />
                </RadioGroup>
            </FormControl>
        </Stack>
    );
};
