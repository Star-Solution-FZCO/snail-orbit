import { Box, useTheme } from "@mui/material";
import MDEditorLib from "@uiw/react-md-editor";
import { FC } from "react";

interface IMDEditorProps {
    value?: string;
    onChange: (value?: string) => void;
}

const MDEditor: FC<IMDEditorProps> = ({ value, onChange }) => {
    const theme = useTheme();

    return (
        <Box data-color-mode={theme.palette.mode} width="100%">
            <Box className="wmde-markdown-var" />

            <MDEditorLib value={value} onChange={onChange} />
        </Box>
    );
};

export { MDEditor };
