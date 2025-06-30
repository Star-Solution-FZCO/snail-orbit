import {
    Button,
    ClickAwayListener,
    FormControlLabel,
    Paper,
    Popper,
    Stack,
    Switch,
} from "@mui/material";
import {
    bindPopper,
    bindToggle,
    usePopupState,
} from "material-ui-popup-state/hooks";
import { useTranslation } from "react-i18next";
import type { IssueRowViewParams } from "./issue_row/issue_row.types";

type IssueListProps = {
    rowViewParams: IssueRowViewParams;
    onRowViewParamsChange?: (params: IssueRowViewParams) => void;
};

export const IssuesListSettings = (props: IssueListProps) => {
    const { onRowViewParamsChange, rowViewParams } = props;
    const { t } = useTranslation();

    const popupState = usePopupState({
        variant: "popper",
        popupId: "issue-list-settings",
    });

    return (
        <ClickAwayListener onClickAway={() => popupState.close()}>
            <div>
                <Button size="small" {...bindToggle(popupState)}>
                    {t("settings")}
                </Button>
                <Popper {...bindPopper(popupState)}>
                    <Paper sx={{ px: 2, py: 1 }}>
                        <Stack direction="column" gap={1}>
                            <FormControlLabel
                                label={t("Show custom fields")}
                                control={
                                    <Switch
                                        size="small"
                                        checked={rowViewParams.showCustomFields}
                                        onChange={(e) =>
                                            onRowViewParamsChange?.({
                                                ...rowViewParams,
                                                showCustomFields:
                                                    e.target.checked,
                                            })
                                        }
                                    />
                                }
                            />
                            <FormControlLabel
                                label={t("Show description")}
                                control={
                                    <Switch
                                        size="small"
                                        checked={rowViewParams.showDescription}
                                        onChange={(e) =>
                                            onRowViewParamsChange?.({
                                                ...rowViewParams,
                                                showDescription:
                                                    e.target.checked,
                                            })
                                        }
                                    />
                                }
                            />
                            <FormControlLabel
                                label={t("Show dividers")}
                                control={
                                    <Switch
                                        size="small"
                                        checked={rowViewParams.showDividers}
                                        onChange={(e) =>
                                            onRowViewParamsChange?.({
                                                ...rowViewParams,
                                                showDividers: e.target.checked,
                                            })
                                        }
                                    />
                                }
                            />
                        </Stack>
                    </Paper>
                </Popper>
            </div>
        </ClickAwayListener>
    );
};
