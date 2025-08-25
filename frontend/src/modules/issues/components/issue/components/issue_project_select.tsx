import { Box, Button } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { projectApi } from "shared/model";
import type { ProjectT } from "shared/model/types";
import { FormAutocompletePopover } from "shared/ui/fields/form_autocomplete/form_autocomplete";
import { noLimitListQueryParams, useParams } from "shared/utils";

type IssueProjectSelectProps = {
    selectedProjectSlug: string | null | undefined;
    onChange: (value: ProjectT | null) => void;
};

type Option = {
    name: string;
    slug: string;
    id: string;
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
        (value: Option) => {
            setAnchorEl(null);
            if (value.id === "NONE") onChange(null);
            else onChange(value as ProjectT);
        },
        [onChange],
    );

    const options = useMemo(() => {
        const items: Option[] = [...(data?.payload.items || [])];
        items.unshift({ slug: t("All"), name: "", id: "NONE" });

        return items;
    }, [data, t]);

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
                    {selectedProjectSlug || t("All")}
                </Box>
            </Button>

            <FormAutocompletePopover
                id="issue-project-select"
                open={!!anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorEl={anchorEl}
                options={options}
                getOptionKey={(option) => option.name}
                getOptionLabel={(option) => option.slug}
                getOptionDescription={(option) => option.name}
                onChange={(_, value) => handleChange(value as Option)}
            />
        </>
    );
};
