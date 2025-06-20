import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Collapse, IconButton, Stack, Typography } from "@mui/material";
import { memo, useState, type FC } from "react";
import { useTranslation } from "react-i18next";
import { MarkdownRenderer } from "shared/ui";

interface IMDPreviewProps {
    content: string | null;
}

export const MDPreview: FC<IMDPreviewProps> = memo(({ content }) => {
    const { t } = useTranslation();

    const [expanded, setExpanded] = useState(false);

    return (
        <Stack>
            <Box display="flex" alignItems="center" gap={0.5}>
                <IconButton
                    sx={{ p: 0 }}
                    onClick={() => setExpanded(!expanded)}
                    size="small"
                >
                    <ExpandMoreIcon
                        sx={{
                            transform: expanded
                                ? "rotate(0deg)"
                                : "rotate(-90deg)",
                            transition: "transform 0.2s",
                        }}
                        fontSize="small"
                    />
                </IconButton>

                <Typography fontWeight="bold">
                    {t("issues.preview.title")}
                </Typography>
            </Box>

            <Collapse in={expanded}>
                <Box mt={1}>
                    <MarkdownRenderer content={content} />
                </Box>
            </Collapse>
        </Stack>
    );
});
