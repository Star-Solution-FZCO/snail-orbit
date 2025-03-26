import { ListAlt } from "@mui/icons-material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import {
    CircularProgress,
    IconButton,
    InputAdornment,
    TextField,
    Tooltip,
} from "@mui/material";
import { bindPopover, bindTrigger } from "material-ui-popup-state";
import { usePopupState } from "material-ui-popup-state/hooks";
import type { FC, SyntheticEvent } from "react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { SearchT } from "types/search";
import { SearchSelectPopover } from "widgets/search_select/search_select_popover";

type SearchFieldProps = {
    value: string;
    onChange: (value: string) => void;
    loading?: boolean;
    onQueryBuilderClick?: () => void;
    queryBuilderActive?: boolean;
};

export const SearchField: FC<SearchFieldProps> = (props) => {
    const {
        value,
        onChange,
        loading,
        queryBuilderActive,
        onQueryBuilderClick,
    } = props;

    const searchSelectPopoverState = usePopupState({
        variant: "popover",
        popupId: "search-select",
    });
    const { t } = useTranslation();

    const handleSavedSearchSelect = useCallback(
        (_: SyntheticEvent, value: SearchT | SearchT[] | null) => {
            if (!value) return;
            const query = Array.isArray(value) ? value[0].query : value.query;
            onChange(query);
        },
        [onChange],
    );

    return (
        <TextField
            fullWidth
            size="small"
            placeholder={t("placeholder.search")}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            slotProps={{
                input: {
                    endAdornment: (
                        <InputAdornment position="end">
                            {loading && (
                                <CircularProgress size={14} color="inherit" />
                            )}
                            <>
                                <Tooltip title={t("searchListIcon.tooltip")}>
                                    <IconButton
                                        size="small"
                                        color={
                                            searchSelectPopoverState.isOpen
                                                ? "primary"
                                                : "default"
                                        }
                                        {...bindTrigger(
                                            searchSelectPopoverState,
                                        )}
                                    >
                                        <ListAlt />
                                    </IconButton>
                                </Tooltip>
                                <SearchSelectPopover
                                    {...bindPopover(searchSelectPopoverState)}
                                    initialQueryString={value}
                                    onChange={handleSavedSearchSelect}
                                />
                            </>
                            <Tooltip title={t("queryBuilderIcon.tooltip")}>
                                <IconButton
                                    onClick={onQueryBuilderClick}
                                    size="small"
                                    color={
                                        queryBuilderActive
                                            ? "primary"
                                            : "default"
                                    }
                                >
                                    <FilterAltIcon />
                                </IconButton>
                            </Tooltip>
                        </InputAdornment>
                    ),
                },
            }}
        />
    );
};
