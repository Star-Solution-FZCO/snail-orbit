import { Box, Button } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { projectApi } from "shared/model";
import type { ProjectT } from "shared/model/types";
import { FormAutocompletePopover } from "shared/ui/fields/form_autocomplete/form_autocomplete";
import { noLimitListQueryParams, useParams } from "shared/utils";

type IssueProjectSelectProps = {
    selectedProjectSlug: string[] | null | undefined;
    onChange: (value: ProjectT[]) => void;
};

export const IssueSearchSelect = (props: IssueProjectSelectProps) => {
    const { selectedProjectSlug, onChange } = props;

    const { t } = useTranslation();

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [listQueryParams] = useParams(noLimitListQueryParams);

    const { data } = projectApi.useListProjectQuery(listQueryParams, {
        skip: !anchorEl,
    });

    const handleChange = useCallback(
        (value: ProjectT[]) => {
            onChange(value as ProjectT[]);
        },
        [onChange],
    );

    const options = useMemo(() => {
        return data?.payload.items || [];
    }, [data]);

    const selectedValues = useMemo(() => {
        return options.filter((option) =>
            selectedProjectSlug?.includes(option.slug),
        );
    }, [options, selectedProjectSlug]);

    return (
        <>
            <Button
                variant="contained"
                sx={{
                    minWidth: 100,
                    maxWidth: 170,
                    px: 1,
                }}
                onClick={(e) => setAnchorEl(e.currentTarget)}
            >
                <Box
                    sx={{
                        fontWeight: "bold",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {selectedProjectSlug?.length
                        ? `${selectedProjectSlug[0]}${selectedProjectSlug.length > 1 ? ` +${selectedProjectSlug.length - 1}` : ""}`
                        : t("All")}
                </Box>
            </Button>

            <FormAutocompletePopover
                id="issue-project-select"
                open={!!anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorEl={anchorEl}
                options={options}
                value={selectedValues}
                multiple
                getOptionKey={(option) => option.name}
                getOptionLabel={(option) => option.slug}
                getOptionDescription={(option) => option.name}
                onChange={(_, value) => handleChange(value as ProjectT[])}
            />
        </>
    );
};
