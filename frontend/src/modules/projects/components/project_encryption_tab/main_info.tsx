import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Checkbox,
    FormControlLabel,
    FormGroup,
    Typography,
} from "@mui/material";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { EncryptionSettingsT } from "shared/model/types";

type MainInfoProps = {
    encryptionSettings: EncryptionSettingsT;
};

export const MainInfo: FC<MainInfoProps> = ({ encryptionSettings }) => {
    const { t } = useTranslation();

    return (
        <Accordion>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                id="summary"
                aria-controls="summary"
            >
                <Typography component="span">
                    {t("projectEncryptionTab.summaryHeader")}
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <FormGroup row>
                    <FormControlLabel
                        label={t("projectEncryptionTab.isCommentsEncrypted")}
                        control={
                            <Checkbox
                                checked={encryptionSettings.encrypt_comments}
                                disabled
                                size="small"
                            />
                        }
                    />
                    <FormControlLabel
                        label={t("projectEncryptionTab.isDescriptionEncrypted")}
                        control={
                            <Checkbox
                                checked={encryptionSettings.encrypt_description}
                                disabled
                                size="small"
                            />
                        }
                    />
                    <FormControlLabel
                        label={t("projectEncryptionTab.isAttachmentsEncrypted")}
                        control={
                            <Checkbox
                                checked={encryptionSettings.encrypt_attachments}
                                disabled
                                size="small"
                            />
                        }
                    />
                </FormGroup>
                <Typography variant="caption" whiteSpace="pre-wrap">
                    {encryptionSettings.encryption_keys?.[0]?.public_key}
                </Typography>
            </AccordionDetails>
        </Accordion>
    );
};
