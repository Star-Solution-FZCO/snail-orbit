import { useTheme } from "@mui/material";

const useCKEditorStyles = () => {
    const theme = useTheme();

    return {
        "& pre": {
            color: theme.palette.text.primary,
        },
        "--ck-border-radius": theme.spacing(0.5),
        "--ck-font-size-base": "14px",

        "--ck-custom-background": theme.palette.background.paper,
        "--ck-custom-foreground": theme.palette.background.default,
        "--ck-custom-border": theme.palette.divider,
        "--ck-custom-white": theme.palette.common.white,

        "--ck-color-base-foreground": theme.palette.text.primary,
        "--ck-color-base-border": theme.palette.divider,
        "--ck-color-base-background": theme.palette.background.paper,
        "--ck-color-focus-border": theme.palette.primary.main,
        "--ck-color-text": theme.palette.text.primary,
        "--ck-color-shadow-drop": "hsla(0, 0%, 0%, 0.2)",
        "--ck-color-shadow-inner": "hsla(0, 0%, 0%, 0.1)",

        "--ck-color-button-default-background":
            theme.palette.background.default,
        "--ck-color-button-default-hover-background":
            theme.palette.action.hover,
        "--ck-color-button-default-active-background":
            theme.palette.action.focus,
        "--ck-color-button-default-active-shadow":
            theme.palette.action.selected,
        "--ck-color-button-default-disabled-background":
            theme.palette.action.disabledBackground,

        "--ck-color-button-on-background": theme.palette.background.paper,
        "--ck-color-button-on-hover-background": theme.palette.action.hover,
        "--ck-color-button-on-active-background": theme.palette.action.selected,
        "--ck-color-button-on-active-shadow": theme.palette.primary.dark,
        "--ck-color-button-on-disabled-background":
            theme.palette.action.disabledBackground,

        "--ck-color-button-action-background": theme.palette.success.main,
        "--ck-color-button-action-hover-background": theme.palette.success.dark,
        "--ck-color-button-action-active-background":
            theme.palette.success.dark,
        "--ck-color-button-action-active-shadow": theme.palette.success.dark,
        "--ck-color-button-action-text": theme.palette.common.white,

        "--ck-color-button-save": theme.palette.success.main,
        "--ck-color-button-cancel": theme.palette.error.main,

        "--ck-color-dropdown-panel-background":
            theme.palette.background.default,
        "--ck-color-dropdown-panel-border": theme.palette.divider,

        "--ck-color-dialog-background": theme.palette.background.paper,
        "--ck-color-dialog-form-header-border": theme.palette.divider,

        "--ck-color-split-button-hover-background": theme.palette.action.hover,
        "--ck-color-split-button-hover-border": theme.palette.divider,

        "--ck-color-input-background": theme.palette.background.default,
        "--ck-color-input-border": theme.palette.divider,
        "--ck-color-input-text": theme.palette.text.primary,
        "--ck-color-input-disabled-background":
            theme.palette.action.disabledBackground,
        "--ck-color-input-disabled-border": theme.palette.action.disabled,
        "--ck-color-input-disabled-text": theme.palette.text.disabled,

        "--ck-color-labeled-field-label-background":
            theme.palette.background.paper,

        "--ck-color-list-background": theme.palette.background.default,
        "--ck-color-list-button-hover-background": theme.palette.action.hover,
        "--ck-color-list-button-on-background": theme.palette.primary.main,
        "--ck-color-list-button-on-background-focus":
            theme.palette.primary.dark,
        "--ck-color-list-button-on-text": theme.palette.common.white,

        "--ck-color-panel-background": theme.palette.background.paper,
        "--ck-color-panel-border": theme.palette.divider,

        "--ck-color-toolbar-background": theme.palette.background.paper,
        "--ck-color-toolbar-border": theme.palette.divider,

        "--ck-color-tooltip-background": theme.palette.background.default,
        "--ck-color-tooltip-text": theme.palette.text.secondary,

        "--ck-color-image-caption-background": theme.palette.background.paper,
        "--ck-color-image-caption-text": theme.palette.text.secondary,

        "--ck-color-widget-blurred-border": theme.palette.divider,
        "--ck-color-widget-hover-border": theme.palette.primary.light,
        "--ck-color-widget-editable-focus-background":
            theme.palette.common.white,

        "--ck-color-link-default": theme.palette.info.main,
    };
};

export { useCKEditorStyles };
