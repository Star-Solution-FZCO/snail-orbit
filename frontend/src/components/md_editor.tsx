import { Box, useTheme } from "@mui/material";
import MDEditorLib from "@uiw/react-md-editor";
import { ComponentProps, FC } from "react";

type IMDEditorProps = ComponentProps<typeof MDEditorLib>;

const MDEditor: FC<IMDEditorProps> = (props) => {
    const theme = useTheme();

    return (
        <Box data-color-mode={theme.palette.mode} width="100%">
            <Box className="wmde-markdown-var" />

            <MDEditorLib {...props} />
        </Box>
    );
};

export { MDEditor };
