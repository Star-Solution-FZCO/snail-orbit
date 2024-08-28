import { Popper, styled } from "@mui/material";

export const FieldPopper = styled(Popper)(({ theme }) => ({
    border: `1px solid ${theme.palette.mode === "light" ? "#e1e4e8" : "#30363d"}`,
    boxShadow: `0 8px 24px ${
        theme.palette.mode === "light"
            ? "rgba(149, 157, 165, 0.2)"
            : "rgb(1, 4, 9)"
    }`,
    borderRadius: 6,
    minWidth: 300,
    zIndex: theme.zIndex.modal,
    fontSize: 13,
    color: theme.palette.mode === "light" ? "#24292e" : "#c9d1d9",
    backgroundColor: theme.palette.mode === "light" ? "#fff" : "#1c2128",
}));

export const defaultModifiers = {
    flip: {
        name: "flip",
        enabled: true,
        options: {
            rootBoundary: "viewport",
            padding: 8,
        },
    },
    preventOverflow: {
        name: "preventOverflow",
        enabled: true,
        options: {
            altAxis: true,
            tether: true,
            rootBoundary: "viewport",
            padding: 8,
        },
    },
};

export default FieldPopper;
