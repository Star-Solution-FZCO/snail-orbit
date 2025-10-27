import {
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
    Stack,
    useColorScheme,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type { IssueLinkMode } from "shared/model/types/settings";
import {
    ISSUE_LINK_MODE_DEFAULT_VALUE,
    ISSUE_LINK_MODE_KEY,
} from "shared/model/types/settings";
import { useLSState } from "shared/utils/helpers/local-storage";

export const Workspace = () => {
    const { t } = useTranslation();

    const { mode: themeMode, setMode } = useColorScheme();

    const [issueLinkMode, setIssueLinkMode] = useLSState<IssueLinkMode>(
        ISSUE_LINK_MODE_KEY,
        ISSUE_LINK_MODE_DEFAULT_VALUE,
    );

    return (
        <Stack spacing={2} height={1}>
            <FormControl>
                <FormLabel id="theme-toggle">
                    {t("profile.workspace.theme")}
                </FormLabel>
                <RadioGroup
                    name="theme-toggle"
                    value={themeMode}
                    onChange={(event) =>
                        setMode(
                            event.target.value as "system" | "light" | "dark",
                        )
                    }
                    aria-labelledby="theme-toggle"
                    row
                >
                    <FormControlLabel
                        value="system"
                        control={<Radio />}
                        label={t("profile.workspace.theme.system")}
                    />
                    <FormControlLabel
                        value="light"
                        control={<Radio />}
                        label={t("profile.workspace.theme.light")}
                    />
                    <FormControlLabel
                        value="dark"
                        control={<Radio />}
                        label={t("profile.workspace.theme.dark")}
                    />
                </RadioGroup>
            </FormControl>

            <FormControl>
                <FormLabel id="issue-link-toggle">
                    {t("profile.workspace.issueLink")}
                </FormLabel>
                <RadioGroup
                    name="issue-link-toggle"
                    value={issueLinkMode}
                    onChange={(event) =>
                        setIssueLinkMode(event.target.value as IssueLinkMode)
                    }
                    aria-labelledby="issue-link-toggle"
                    row
                >
                    <FormControlLabel
                        value="long"
                        control={<Radio />}
                        label={t("profile.workspace.issueLink.long")}
                    />
                    <FormControlLabel
                        value="short"
                        control={<Radio />}
                        label={t("profile.workspace.issueLink.short")}
                    />
                </RadioGroup>
            </FormControl>
        </Stack>
    );
};
